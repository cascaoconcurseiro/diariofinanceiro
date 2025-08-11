/**
 * SISTEMA DE CRIPTOGRAFIA PARA LOGS INTERNOS
 * Criptografia simples para proteger logs em produção
 */

import { EncryptedDetails } from '../types/TestTypes';
import { getEncryptionKey, isDevelopmentMode } from '../config/HiddenTestConfig';

export class LogEncryption {
  private static key: string | null = null;

  // Obter chave de criptografia
  private static getKey(): string {
    if (!LogEncryption.key) {
      LogEncryption.key = getEncryptionKey();
    }
    return LogEncryption.key;
  }

  // Criptografar dados (implementação simples)
  public static encrypt(data: any): EncryptedDetails {
    try {
      // Em desenvolvimento, não criptografar para facilitar debug
      if (isDevelopmentMode()) {
        return {
          encrypted: JSON.stringify(data),
          iv: 'dev_mode',
          timestamp: Date.now()
        };
      }

      const jsonData = JSON.stringify(data);
      const key = this.getKey();
      
      // Implementação simples de "criptografia" (Base64 + XOR)
      // Para produção real, usar crypto-js ou similar
      const encrypted = this.simpleEncrypt(jsonData, key);
      
      return {
        encrypted,
        iv: this.generateIV(),
        timestamp: Date.now()
      };
    } catch (error) {
      // Em caso de erro, retornar dados não criptografados mas marcados
      return {
        encrypted: JSON.stringify({ error: 'encryption_failed', data }),
        iv: 'error',
        timestamp: Date.now()
      };
    }
  }

  // Descriptografar dados
  public static decrypt(encryptedDetails: EncryptedDetails): any {
    try {
      // Em desenvolvimento, dados não estão realmente criptografados
      if (isDevelopmentMode() || encryptedDetails.iv === 'dev_mode') {
        return JSON.parse(encryptedDetails.encrypted);
      }

      if (encryptedDetails.iv === 'error') {
        return JSON.parse(encryptedDetails.encrypted);
      }

      const key = this.getKey();
      const decrypted = this.simpleDecrypt(encryptedDetails.encrypted, key);
      
      return JSON.parse(decrypted);
    } catch (error) {
      return { error: 'decryption_failed', timestamp: encryptedDetails.timestamp };
    }
  }

  // Criptografia simples usando XOR
  private static simpleEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
  }

  // Descriptografia simples usando XOR
  private static simpleDecrypt(encrypted: string, key: string): string {
    try {
      const decoded = atob(encrypted); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch {
      return '{"error": "invalid_encrypted_data"}';
    }
  }

  // Gerar IV simples
  private static generateIV(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Verificar se dados estão criptografados
  public static isEncrypted(data: any): boolean {
    return data && typeof data === 'object' && 
           'encrypted' in data && 'iv' in data && 'timestamp' in data;
  }

  // Limpar chave da memória (para segurança)
  public static clearKey(): void {
    LogEncryption.key = null;
  }
}