
import { type QrScanner } from 'qr-scanner';
    
declare module 'qr-scanner' {
    interface QrScanner {
      destroy: () => void;
    }
}
