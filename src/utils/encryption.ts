// Criptografia simples para dados sensíveis
class SimpleEncryption {
  private key = 'diario-financeiro-key-2024';

  encrypt(text: string): string {
    try {
      return btoa(text.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
      ).join(''));
    } catch {
      return text;
    }
  }

  decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      return decoded.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
      ).join('');
    } catch {
      return encrypted;
    }
  }
}

export const encryption = new SimpleEncryption();