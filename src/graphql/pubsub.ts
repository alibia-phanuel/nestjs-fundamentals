import { PubSub } from 'graphql-subscriptions';

// ✅ PubSub — système publish/subscribe
// publish()   → émet un événement
// asyncIterableIterator() → écoute un événement

// Instance globale — partagée dans toute l'app
export const pubSub = new PubSub();
