"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  updateCampaignProgress,
} from "@/lib/campaigns/campaign-service";
import { revalidatePath } from "next/cache";

/**
 * Send campaign (server action wrapper)
 */
export async function sendCampaignAction(campaignId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const result = await sendCampaign(campaignId);
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return result;
  } catch (error) {
    console.error("Send campaign action error:", error);
    return { error: "Failed to send campaign" };
  }
}

/**
 * Pause campaign (server action wrapper)
 */
export async function pauseCampaignAction(campaignId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const result = await pauseCampaign(campaignId);
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return result;
  } catch (error) {
    console.error("Pause campaign action error:", error);
    return { error: "Failed to pause campaign" };
  }
}

/**
 * Resume campaign (server action wrapper)
 */
export async function resumeCampaignAction(campaignId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const result = await resumeCampaign(campaignId);
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return result;
  } catch (error) {
    console.error("Resume campaign action error:", error);
    return { error: "Failed to resume campaign" };
  }
}

/**
 * Cancel campaign (server action wrapper)
 */
export async function cancelCampaignAction(campaignId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const result = await cancelCampaign(campaignId);
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return result;
  } catch (error) {
    console.error("Cancel campaign action error:", error);
    return { error: "Failed to cancel campaign" };
  }
}

/**
 * Update campaign progress (server action wrapper)
 */
export async function updateCampaignProgressAction(campaignId: string) {
  try {
    const result = await updateCampaignProgress(campaignId);
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return result;
  } catch (error) {
    console.error("Update campaign progress error:", error);
    return { error: "Failed to update campaign progress" };
  }
}

