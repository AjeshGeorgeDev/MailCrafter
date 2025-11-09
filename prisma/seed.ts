import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create default languages - ordered alphabetically by name
  // Most common languages worldwide
  const languages = [
    { code: "ar", name: "Arabic (العربية)", isActive: false },
    { code: "bn", name: "Bengali (বাংলা)", isActive: false },
    { code: "zh", name: "Chinese (中文)", isActive: false },
    { code: "cs", name: "Czech (Čeština)", isActive: false },
    { code: "da", name: "Danish (Dansk)", isActive: false },
    { code: "nl", name: "Dutch (Nederlands)", isActive: false },
    { code: "en", name: "English", isActive: true },
    { code: "fi", name: "Finnish (Suomi)", isActive: false },
    { code: "fr", name: "French (Français)", isActive: false },
    { code: "de", name: "German (Deutsch)", isActive: false },
    { code: "el", name: "Greek (Ελληνικά)", isActive: false },
    { code: "he", name: "Hebrew (עברית)", isActive: false },
    { code: "hi", name: "Hindi (हिन्दी)", isActive: false },
    { code: "hu", name: "Hungarian (Magyar)", isActive: false },
    { code: "id", name: "Indonesian (Bahasa Indonesia)", isActive: false },
    { code: "it", name: "Italian (Italiano)", isActive: false },
    { code: "ja", name: "Japanese (日本語)", isActive: false },
    { code: "ko", name: "Korean (한국어)", isActive: false },
    { code: "ms", name: "Malay (Bahasa Melayu)", isActive: false },
    { code: "no", name: "Norwegian (Norsk)", isActive: false },
    { code: "pl", name: "Polish (Polski)", isActive: false },
    { code: "pt", name: "Portuguese (Português)", isActive: false },
    { code: "ro", name: "Romanian (Română)", isActive: false },
    { code: "ru", name: "Russian (Русский)", isActive: false },
    { code: "sk", name: "Slovak (Slovenčina)", isActive: false },
    { code: "sv", name: "Swedish (Svenska)", isActive: false },
    { code: "th", name: "Thai (ไทย)", isActive: false },
    { code: "tr", name: "Turkish (Türkçe)", isActive: false },
    { code: "uk", name: "Ukrainian (Українська)", isActive: false },
    { code: "vi", name: "Vietnamese (Tiếng Việt)", isActive: false },
    { code: "es", name: "Spanish (Español)", isActive: false },
  ];

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {},
      create: lang,
    });
    console.log(`✓ Language ${lang.code} created/updated`);
  }

  // Create admin user
  const adminEmail = "admin@mailcrafter.com";
  const adminPassword = await hashPassword("Admin123!@#");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: "Admin User",
      role: Role.OWNER,
      emailVerified: new Date(),
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // Create sample organization
  const organization = await prisma.organization.upsert({
    where: { id: "sample-org-id" },
    update: {},
    create: {
      id: "sample-org-id",
      name: "Sample Organization",
      defaultLanguage: "en",
      members: {
        create: {
          userId: admin.id,
          role: Role.OWNER,
        },
      },
    },
  });
  console.log(`✓ Organization created: ${organization.name}`);

  // Create basic user variables
  const userVariables = [
    {
      name: "User Name",
      path: "user.name",
      description: "Full name of the user",
      type: "string",
      sampleValue: "John Doe",
      category: "User",
    },
    {
      name: "User Email",
      path: "user.email",
      description: "Email address of the user",
      type: "string",
      sampleValue: "john.doe@example.com",
      category: "User",
    },
    {
      name: "First Name",
      path: "user.firstName",
      description: "First name of the user",
      type: "string",
      sampleValue: "John",
      category: "User",
    },
    {
      name: "Last Name",
      path: "user.lastName",
      description: "Last name of the user",
      type: "string",
      sampleValue: "Doe",
      category: "User",
    },
    {
      name: "User ID",
      path: "user.id",
      description: "Unique identifier for the user",
      type: "string",
      sampleValue: "usr_123456",
      category: "User",
    },
    {
      name: "User Phone",
      path: "user.phone",
      description: "Phone number of the user",
      type: "string",
      sampleValue: "+1 (555) 123-4567",
      category: "User",
    },
    {
      name: "User Avatar",
      path: "user.avatar",
      description: "Avatar/Profile picture URL of the user",
      type: "string",
      sampleValue: "https://example.com/avatar.jpg",
      category: "User",
    },
  ];

  for (const variable of userVariables) {
    await prisma.customVariable.upsert({
      where: {
        organizationId_path: {
          organizationId: organization.id,
          path: variable.path,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        ...variable,
      },
    });
    console.log(`✓ Variable created: ${variable.path}`);
  }

  console.log("✓ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

