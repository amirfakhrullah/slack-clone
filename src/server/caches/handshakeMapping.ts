import { uuid } from "uuidv4";
import { getMinuteDifferenceFromNow } from "~/utils/dateDiff";

const MAX_EXPIRY_DURATION_IN_MINUTES = 60;

// cache key to { userId, lastFetched }
const handshakeMapping = new Map<
  string,
  {
    userId: string;
    lastFetched: Date;
  }
>();

export const assignKeyToUser = (userId: string) => {
  handshakeMapping.forEach((values, key) => {
    if (values.userId === userId) {
      handshakeMapping.delete(key);
    }
  });

  let key = uuid();
  // to avoid getting similar key with other users
  while (handshakeMapping.has(key)) {
    key = uuid();
  }

  handshakeMapping.set(key, {
    userId,
    lastFetched: new Date(),
  });
  return key;
};

export const validateKeyAndGetUserId = (key: string) => {
  if (!handshakeMapping.has(key)) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { userId, lastFetched } = handshakeMapping.get(key)!;

  if (
    getMinuteDifferenceFromNow(lastFetched) >= MAX_EXPIRY_DURATION_IN_MINUTES
  ) {
    handshakeMapping.delete(key);
    return;
  }
  return userId;
};

export const deleteExpiredKeys = () => {
  handshakeMapping.forEach((values, key) => {
    if (
      getMinuteDifferenceFromNow(values.lastFetched) >=
      MAX_EXPIRY_DURATION_IN_MINUTES
    ) {
      handshakeMapping.delete(key);
    }
  });
};
