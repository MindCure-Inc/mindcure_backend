import { AuthObject } from "@clerk/clerk-sdk-node"; // or clerk-backend if you're using that

declare global {
    namespace Express {
        interface Request {
            auth?: AuthObject;
        }
    }
}
