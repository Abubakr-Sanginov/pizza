import {
  iikoRequest,
  sendOrderToIiko,
  getOrderStatusFromIiko,
  pollPendingOrders,
  retryFailedOrders,
} from './iiko';

export { IikoError } from './iiko';

export class IikoService {
  static async getOrganizations() {
    const data = await iikoRequest<{ organizations: any[] }>('/organizations', {});
    return data.organizations;
  }

  static async getNomenclature(organizationId: string) {
    return iikoRequest('/nomenclature', { organizationId });
  }

  static async syncOrderToIiko(order: any, items: any[]) {
    const result = await sendOrderToIiko(order, items);
    if (result.status !== 'sent') return null;
    return { order: { id: result.iikoOrderId } };
  }

  static getOrderStatus = getOrderStatusFromIiko;
  static pollPendingOrders = pollPendingOrders;
  static retryFailedOrders = retryFailedOrders;
}
