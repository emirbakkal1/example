const { PrismaClient } = require("@prisma/client");
const { fieldEncryptionExtension } = require("prisma-field-encryption");
const client = new PrismaClient();

const prisma = client.$extends(
  fieldEncryptionExtension({
    encryptionKey: process.env.CRYPTR_KEY,
  }),
);

module.exports = {
  prisma,
};
