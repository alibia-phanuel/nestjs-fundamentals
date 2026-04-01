// On définit la FORME de notre objet de connexion
// Interface = contrat qui dit "cet objet doit avoir ces propriétés"
export interface Connection {
  CONNECTION_STRING: string;
  DB: string;
  DBNAME: string;
}

// On crée l'objet réel qui respecte le contrat Connection
// C'est cet objet qui sera injecté dans les classes qui en ont besoin
export const connection: Connection = {
  CONNECTION_STRING: 'mongodb://localhost:27017',
  DB: 'mydb',
  DBNAME: 'mydbname',
};
