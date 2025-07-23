import { paymentQueue } from "../jobs/queue";

export async function addPaymentJob(data: any) {
  await paymentQueue.add("process-payment", data);
}
