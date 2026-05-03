import axios from 'axios';

/**
 * Сервис для интеграции с iikoCloud API (v1)
 * Документация: https://api-ru.iiko.services/
 */
export class IikoService {
  private static apiBase = 'https://api-ru.iiko.services/api/1';
  private static apiLogin = process.env.IIKO_API_LOGIN || '';

  /**
   * Получение токена доступа
   */
  private static async getAccessToken(): Promise<string> {
    if (!this.apiLogin) {
      throw new Error('IIKO_API_LOGIN is not defined in environment variables');
    }

    try {
      const response = await axios.post(`${this.apiBase}/access_token`, {
        apiLogin: this.apiLogin,
      });
      return response.data.token;
    } catch (error: any) {
      console.error('[IIKO] Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with iiko');
    }
  }

  /**
   * Получение списка организаций
   */
  public static async getOrganizations() {
    const token = await this.getAccessToken();
    const response = await axios.get(`${this.apiBase}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.organizations;
  }

  /**
   * Получение меню (номенклатуры) заведения
   */
  public static async getNomenclature(organizationId: string) {
    const token = await this.getAccessToken();
    const response = await axios.post(
      `${this.apiBase}/nomenclature`,
      { organizationId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  /**
   * Создание заказа на доставку
   */
  public static async createDeliveryOrder(orderData: any) {
    const token = await this.getAccessToken();
    
    // В iikoCloud создание заказа идет через POST /deliveries/create
    try {
      const response = await axios.post(
        `${this.apiBase}/deliveries/create`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error: any) {
      console.error('[IIKO] Create Order Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Маппинг нашего заказа в формат iiko
   */
  public static async syncOrderToIiko(order: any, items: any[]) {
    const organizationId = process.env.IIKO_ORGANIZATION_ID;
    const terminalGroupId = process.env.IIKO_TERMINAL_GROUP_ID;

    if (!organizationId || !terminalGroupId) {
      console.warn('[IIKO] Organization or Terminal ID missing. Skipping iiko sync.');
      return null;
    }

    const iikoOrder = {
      organizationId,
      terminalGroupId,
      order: {
        id: null, // iiko сама создаст ID
        externalNumber: order.id.toString(),
        phone: order.phone,
        customer: {
          name: order.fullName,
          type: 'one-time',
        },
        deliveryPoint: {
          address: {
             street: { name: order.address },
             house: '', // Если есть возможность разделить адрес на улицу/дом, лучше сделать это
             flat: order.apartment || '',
             entrance: order.entrance || '',
             floor: order.floor || '',
             doorphone: order.doorCode || '',
          }
        },
        comment: order.comment || '',
        items: items.map((item) => ({
          productId: item.productItem.iikoId, // Тот самый внешний ID из iiko
          type: 'Product',
          amount: item.quantity,
          modifiers: item.ingredients?.map((ing: any) => ({
            productId: ing.iikoId,
            amount: 1,
          })).filter((m: any) => m.productId), // Только если у ингредиента есть iikoId
        })).filter(item => item.productId), // Только если у товара есть iikoId
        payments: [
          {
            paymentTypeKind: 'Cash', // По умолчанию наличные, можно менять
            sum: order.totalAmount,
            paymentTypeId: process.env.IIKO_PAYMENT_TYPE_ID_CASH, // ID типа оплаты из iiko
            isProcessedExternally: false,
          }
        ],
      }
    };

    return this.createDeliveryOrder(iikoOrder);
  }
}
