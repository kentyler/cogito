/**
 * Avatar Operations - Consolidated exports
 * Replaces the monolithic avatar-operations.js file
 */

// CRUD operations
export { 
  getAvatarById, 
  createAvatar,
  getAvatarMetadata,
  processAvatarTemplate
} from './avatar-crud.js';

// Client-specific operations
export { 
  getClientAvatars, 
  getDefaultAvatar,
  assignAvatarToClient
} from './avatar-client.js';

// User and selection operations
export { 
  getUserLastAvatar,
  updateUserLastAvatar,
  selectAvatar
} from './avatar-selection.js';