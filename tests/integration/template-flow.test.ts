import { describe, it, expect, beforeEach } from 'vitest';
import { createTestUser, createTestOrganization, createTestOrganizationMember, createTestTemplate, cleanupTestData } from '../utils/test-helpers';
import { getTemplateWithUniqueIds } from '@/lib/templates/predefined-templates';
import { saveTemplateLanguage, getAllTemplateLanguages } from '@/lib/templates/template-language-helpers';

describe.skip('Template Flow Integration', () => {
  // Skip integration tests that require a real database
  // These should be run separately with a test database configured
  let testUser: any;
  let testOrg: any;

  beforeEach(async () => {
    // These tests require a real database connection
    // Skip if DATABASE_URL is not set or points to a test database
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
      return;
    }
    await cleanupTestData();
    testUser = await createTestUser();
    testOrg = await createTestOrganization();
    await createTestOrganizationMember({
      userId: testUser.id,
      organizationId: testOrg.id,
    });
  });

  it('should create template from predefined template and retrieve it', async () => {
    // Get a predefined template
    const predefinedTemplate = getTemplateWithUniqueIds('welcome');
    expect(predefinedTemplate).toBeDefined();

    if (!predefinedTemplate) return;

    // Create template in database
    const template = await createTestTemplate({
      organizationId: testOrg.id,
      createdBy: testUser.id,
      name: 'Welcome Email',
    });

    // Save template structure
    await saveTemplateLanguage(
      template.id,
      'en',
      predefinedTemplate.structure
    );

    // Retrieve template structure
    const allStructures = await getAllTemplateLanguages(template.id);
    expect(allStructures).toBeDefined();
    expect(allStructures['en']).toBeDefined();

    const retrievedStructure = allStructures['en'];
    expect(retrievedStructure.childrenIds).toBeDefined();
    expect(Array.isArray(retrievedStructure.childrenIds)).toBe(true);
  });

  it('should support multiple languages for a template', async () => {
    const template = await createTestTemplate({
      organizationId: testOrg.id,
      createdBy: testUser.id,
    });

    const predefinedTemplate = getTemplateWithUniqueIds('welcome');
    if (!predefinedTemplate) return;

    // Save English structure
    await saveTemplateLanguage(template.id, 'en', predefinedTemplate.structure);

    // Save French structure (copy from English)
    const frStructure = JSON.parse(JSON.stringify(predefinedTemplate.structure));
    await saveTemplateLanguage(template.id, 'fr', frStructure);

    // Retrieve all structures
    const allStructures = await getAllTemplateLanguages(template.id);
    expect(allStructures['en']).toBeDefined();
    expect(allStructures['fr']).toBeDefined();
    expect(Object.keys(allStructures).length).toBe(2);
  });

  it('should maintain structure independence between languages', async () => {
    const template = await createTestTemplate({
      organizationId: testOrg.id,
      createdBy: testUser.id,
    });

    const predefinedTemplate = getTemplateWithUniqueIds('welcome');
    if (!predefinedTemplate) return;

    // Save English
    await saveTemplateLanguage(template.id, 'en', predefinedTemplate.structure);

    // Save French (copy)
    const frStructure = JSON.parse(JSON.stringify(predefinedTemplate.structure));
    await saveTemplateLanguage(template.id, 'fr', frStructure);

    // Modify English structure
    const enStructures = await getAllTemplateLanguages(template.id);
    const modifiedEn = JSON.parse(JSON.stringify(enStructures['en']));
    if (modifiedEn.childrenIds && modifiedEn.childrenIds.length > 0) {
      const firstBlockId = modifiedEn.childrenIds[0];
      if (modifiedEn[firstBlockId]?.data?.props) {
        modifiedEn[firstBlockId].data.props.testProp = 'modified';
      }
    }
    await saveTemplateLanguage(template.id, 'en', modifiedEn);

    // Verify French was not affected
    const finalStructures = await getAllTemplateLanguages(template.id);
    const enHasModification = JSON.stringify(finalStructures['en']).includes('modified');
    const frHasModification = JSON.stringify(finalStructures['fr']).includes('modified');

    expect(enHasModification).toBe(true);
    expect(frHasModification).toBe(false);
  });
});

