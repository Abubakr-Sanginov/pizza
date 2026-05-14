import { z } from 'zod';

export const checkoutFormSchema = z.object({
  firstName: z.string().min(2, { message: 'Имя должно содержать не менее 2-х символов' }),
  lastName: z.string().min(2, { message: 'Фамилия должна содержать не менее 2-х символов' }),
  email: z.string().email({ message: 'Введите корректную почту' }),
  phone: z.string().min(9, { message: 'Введите корректный номер телефона' }),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  storeId: z.coerce.number().optional(),
  address: z.string().optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  entrance: z.string().optional(),
  doorCode: z.string().optional(),
  comment: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  promoCode: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.deliveryType === 'DELIVERY' && (!data.address || data.address.trim().length < 5)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Введите корректный адрес',
      path: ['address'],
    });
  }

  if (data.deliveryType === 'PICKUP' && !data.storeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Выберите заведение для самовывоза',
      path: ['storeId'],
    });
  }
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
