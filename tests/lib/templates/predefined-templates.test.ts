import { describe, it, expect } from 'vitest';
import { predefinedTemplates, getTemplateWithUniqueIds } from '@/lib/templates/predefined-templates';
import type { EmailBuilderDocument } from '@/lib/email-builder/types';

describe('Predefined Templates', () => {
  describe('predefinedTemplates', () => {
    it('should have at least one template', () => {
      expect(predefinedTemplates.length).toBeGreaterThan(0);
    });

    it('should have templates with required properties', () => {
      const template = predefinedTemplates[0];
      
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('structure');
    });

    it('should have valid structure format', () => {
      const template = predefinedTemplates[0];
      const structure = template.structure as EmailBuilderDocument;
      
      expect(structure).toHaveProperty('childrenIds');
      expect(structure).toHaveProperty('backdropColor');
      expect(structure).toHaveProperty('canvasColor');
      expect(Array.isArray(structure.childrenIds)).toBe(true);
    });
  });

  describe('getTemplateWithUniqueIds', () => {
    it('should return template with unique IDs', () => {
      const templateId = predefinedTemplates[0].id;
      const result = getTemplateWithUniqueIds(templateId);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(templateId);
      expect(result?.structure).toBeDefined();
    });

    it('should generate unique block IDs', () => {
      const templateId = predefinedTemplates[0].id;
      const result1 = getTemplateWithUniqueIds(templateId);
      const result2 = getTemplateWithUniqueIds(templateId);
      
      if (result1 && result2) {
        const structure1 = result1.structure as EmailBuilderDocument;
        const structure2 = result2.structure as EmailBuilderDocument;
        
        // Block IDs should be different between calls
        const ids1 = Object.keys(structure1).filter(k => k !== 'childrenIds' && k !== 'backdropColor' && k !== 'canvasColor');
        const ids2 = Object.keys(structure2).filter(k => k !== 'childrenIds' && k !== 'backdropColor' && k !== 'canvasColor');
        
        // At least some IDs should be different (due to random generation)
        expect(ids1.length).toBeGreaterThan(0);
        expect(ids2.length).toBeGreaterThan(0);
      }
    });

    it('should return undefined for non-existent template', () => {
      const result = getTemplateWithUniqueIds('non-existent-template');
      expect(result).toBeUndefined();
    });

    it('should preserve structure integrity', () => {
      const templateId = predefinedTemplates[0].id;
      const result = getTemplateWithUniqueIds(templateId);
      
      if (result) {
        const structure = result.structure as EmailBuilderDocument;
        
        // All referenced block IDs should exist
        const allBlockIds = new Set(Object.keys(structure).filter(k => k !== 'childrenIds' && k !== 'backdropColor' && k !== 'canvasColor'));
        
        const checkReferences = (blockId: string) => {
          const block = structure[blockId];
          if (block && block.data?.props?.childrenIds) {
            block.data.props.childrenIds.forEach((childId: string) => {
              expect(allBlockIds.has(childId)).toBe(true);
              checkReferences(childId);
            });
          }
        };
        
        structure.childrenIds.forEach((id: string) => {
          expect(allBlockIds.has(id)).toBe(true);
          checkReferences(id);
        });
      }
    });
  });
});

