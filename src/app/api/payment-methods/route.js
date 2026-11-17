import { route, ok } from '@/server/http';
import { listPaymentMethods } from '@/server/orders/service';

export const GET = route('payment-methods.list', async () => ok(await listPaymentMethods()));
