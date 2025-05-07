declare module 'flutterwave-node-v3' {
    interface FlutterwaveResponse {
        status: string;
        message: string;
        data: any; // You can replace `any` with more specific types as per the actual API response
    }

    class Flutterwave {
        constructor(apiKey: string);

        verifyTransaction(options: { tx_ref: string }): Promise<FlutterwaveResponse>;
    }

    export default Flutterwave;
}
