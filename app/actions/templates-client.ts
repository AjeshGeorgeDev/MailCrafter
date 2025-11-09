"use server";

import { saveTemplate } from "./templates";

export async function saveTemplateAction(templateId: string, structure: any) {
  return await saveTemplate(templateId, structure);
}

