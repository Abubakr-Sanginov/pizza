import { prisma } from '@/back/prisma/prisma-client';
import { IikoService } from './iiko-service';

export class IikoSyncService {
  /**
   * Полная синхронизация меню из iiko
   */
  public static async syncMenu() {
    const organizationId = process.env.IIKO_ORGANIZATION_ID;
    if (!organizationId) {
      throw new Error('IIKO_ORGANIZATION_ID is not defined');
    }

    console.log('[IIKO SYNC] Fetching nomenclature from iiko...');
    const data = await IikoService.getNomenclature(organizationId);
    
    if (!data || !data.groups || !data.products) {
      throw new Error('Invalid nomenclature data from iiko');
    }

    console.log(`[IIKO SYNC] Found ${data.groups.length} categories and ${data.products.length} products.`);

    // 1. Синхронизируем категории (groups)
    const categoryMap = new Map<string, number>(); // iikoGroupId -> our categoryId
    
    for (const group of data.groups) {
      // Ищем категорию по имени, так как у нас нет iikoId в Category
      let category = await prisma.category.findFirst({
        where: { name: { equals: group.name, mode: 'insensitive' } }
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: group.name }
        });
        console.log(`[IIKO SYNC] Created new category: ${group.name}`);
      }
      categoryMap.set(group.id, category.id);
    }

    // 2. Синхронизируем товары (products)
    let updatedProducts = 0;
    let newProducts = 0;
    let updatedIngredients = 0;

    for (const prod of data.products) {
      if (prod.type === 'modifier') {
        // Это ингредиент / модификатор
        let ingredient = await prisma.ingredient.findFirst({
          where: {
            OR: [
              { iikoId: prod.id },
              { name: { equals: prod.name, mode: 'insensitive' } }
            ]
          }
        });

        const price = prod.sizePrices && prod.sizePrices[0] ? prod.sizePrices[0].price.currentPrice : 0;
        const imageUrl = prod.imageLinks && prod.imageLinks.length > 0 ? prod.imageLinks[0] : '';

        if (ingredient) {
          await prisma.ingredient.update({
            where: { id: ingredient.id },
            data: { iikoId: prod.id, price, imageUrl: imageUrl || ingredient.imageUrl }
          });
          updatedIngredients++;
        } else {
          await prisma.ingredient.create({
            data: {
              name: prod.name,
              iikoId: prod.id,
              price: price,
              imageUrl: imageUrl || 'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA69C1FE796'
            }
          });
        }
      } else if (prod.type === 'dish' || prod.type === 'good') {
        // Это товар (пицца, закуска, напиток)
        const categoryId = categoryMap.get(prod.parentGroup) || 1; // Фоллбэк на первую категорию
        const price = prod.sizePrices && prod.sizePrices[0] ? prod.sizePrices[0].price.currentPrice : 0;
        const imageUrl = prod.imageLinks && prod.imageLinks.length > 0 ? prod.imageLinks[0] : '';

        // Ищем ProductItem по iikoId
        let productItem = await prisma.productItem.findFirst({
          where: { iikoId: prod.id },
          include: { product: true }
        });

        if (!productItem) {
          // Попробуем найти по имени продукта
          let product = await prisma.product.findFirst({
            where: { name: { equals: prod.name, mode: 'insensitive' } }
          });

          if (product) {
            // Если продукт есть, привяжем к нему новый Item или обновим первый попавшийся
            const existingItems = await prisma.productItem.findMany({ where: { productId: product.id } });
            if (existingItems.length > 0) {
              await prisma.productItem.update({
                where: { id: existingItems[0].id },
                data: { iikoId: prod.id, price }
              });
              updatedProducts++;
            } else {
              await prisma.productItem.create({
                data: { price, iikoId: prod.id, productId: product.id }
              });
            }
          } else {
            // Создаем новый продукт
            product = await prisma.product.create({
              data: {
                name: prod.name,
                categoryId: categoryId,
                imageUrl: imageUrl || 'https://media.dodostatic.net/image/r:292x292/11EE7D610D2925109AB2E1C9213386BB.webp'
              }
            });
            await prisma.productItem.create({
              data: { price, iikoId: prod.id, productId: product.id }
            });
            newProducts++;
          }
        } else {
          // Обновляем цену у существующего Item
          await prisma.productItem.update({
            where: { id: productItem.id },
            data: { price }
          });
          // И можем обновить имя/картинку самого продукта, если нужно
          await prisma.product.update({
            where: { id: productItem.productId },
            data: { 
              name: prod.name,
              ...(imageUrl ? { imageUrl } : {}) 
            }
          });
          updatedProducts++;
        }
      }
    }

    console.log(`[IIKO SYNC] Finished! Updated: ${updatedProducts}, New: ${newProducts}, Ingredients updated: ${updatedIngredients}`);
    return { success: true, newProducts, updatedProducts, updatedIngredients };
  }
}
