
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.ProfileScalarFieldEnum = {
  id: 'id',
  externalId: 'externalId',
  role: 'role',
  fullName: 'fullName',
  email: 'email',
  avatarUrl: 'avatarUrl',
  phone: 'phone',
  bio: 'bio',
  timezone: 'timezone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.TherapistDetailScalarFieldEnum = {
  id: 'id',
  profileId: 'profileId',
  specialties: 'specialties',
  certifications: 'certifications',
  yearsExperience: 'yearsExperience',
  verificationStatus: 'verificationStatus',
  hourlyRate: 'hourlyRate',
  availableHours: 'availableHours',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.JournalEntryScalarFieldEnum = {
  id: 'id',
  patientId: 'patientId',
  title: 'title',
  content: 'content',
  mood: 'mood',
  tags: 'tags',
  sharedWithTherapist: 'sharedWithTherapist',
  therapistId: 'therapistId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  profileId: 'profileId'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  receiverId: 'receiverId',
  content: 'content',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.GroupChatScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdById: 'createdById',
  maxMembers: 'maxMembers',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.GroupMemberScalarFieldEnum = {
  id: 'id',
  groupId: 'groupId',
  profileId: 'profileId',
  joinedAt: 'joinedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  id: 'id',
  groupId: 'groupId',
  senderId: 'senderId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.AIChatScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  modelName: 'modelName',
  message: 'message',
  response: 'response',
  tokensUsed: 'tokensUsed',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  therapistId: 'therapistId',
  patientId: 'patientId',
  scheduledAt: 'scheduledAt',
  durationMinutes: 'durationMinutes',
  status: 'status',
  type: 'type',
  txRef: 'txRef',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SessionNoteScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  content: 'content',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.CallLogScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  callerId: 'callerId',
  receiverId: 'receiverId',
  callType: 'callType',
  startedAt: 'startedAt',
  endedAt: 'endedAt',
  durationSeconds: 'durationSeconds',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  content: 'content',
  read: 'read',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.ScheduledMessageScalarFieldEnum = {
  id: 'id',
  senderId: 'senderId',
  receiverId: 'receiverId',
  content: 'content',
  sendAt: 'sendAt',
  sent: 'sent',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.EmotionTrackingScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  emotion: 'emotion',
  detectedAt: 'detectedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.SessionRecordingScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  url: 'url',
  type: 'type',
  duration: 'duration',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  balance: 'balance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  userId: 'userId',
  amount: 'amount',
  type: 'type',
  status: 'status',
  reference: 'reference',
  meta: 'meta',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  patient: 'patient',
  therapist: 'therapist',
  admin: 'admin'
};

exports.VerificationStatus = exports.$Enums.VerificationStatus = {
  pending: 'pending',
  verified: 'verified',
  rejected: 'rejected'
};

exports.MoodType = exports.$Enums.MoodType = {
  happy: 'happy',
  sad: 'sad',
  anxious: 'anxious',
  calm: 'calm',
  angry: 'angry',
  neutral: 'neutral'
};

exports.MessageStatus = exports.$Enums.MessageStatus = {
  pending: 'pending',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read'
};

exports.CallType = exports.$Enums.CallType = {
  video: 'video',
  voice: 'voice'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  message: 'message',
  session_reminder: 'session_reminder',
  group_update: 'group_update'
};

exports.Prisma.ModelName = {
  Profile: 'Profile',
  TherapistDetail: 'TherapistDetail',
  JournalEntry: 'JournalEntry',
  Message: 'Message',
  GroupChat: 'GroupChat',
  GroupMember: 'GroupMember',
  ChatMessage: 'ChatMessage',
  AIChat: 'AIChat',
  Session: 'Session',
  SessionNote: 'SessionNote',
  CallLog: 'CallLog',
  Notification: 'Notification',
  ScheduledMessage: 'ScheduledMessage',
  EmotionTracking: 'EmotionTracking',
  SessionRecording: 'SessionRecording',
  Wallet: 'Wallet',
  Transaction: 'Transaction'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
