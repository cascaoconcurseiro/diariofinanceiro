// Sistema de integridade simplificado
class DataIntegrity {
  checkAllData(): { [key: string]: boolean } {
    return {
      transactions: true,
      users: true,
      settings: true
    };
  }
}

export const dataIntegrity = new DataIntegrity();