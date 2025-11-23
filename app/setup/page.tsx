/**
 * First-Time Setup Page
 * Creates the super admin account and initial organization
 */

export const dynamic = 'force-dynamic';

import { isSetupNeeded } from "@/app/actions/setup";
import { redirect } from "next/navigation";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  // Check if setup is needed
  const { needsSetup } = await isSetupNeeded();

  // If setup is already complete, redirect to login
  if (!needsSetup) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to MailCrafter
            </h1>
            <p className="text-gray-600">
              Let's set up your super admin account to get started
            </p>
          </div>

          <SetupForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          This setup will create your super admin account and initial organization.
          You can add more users after setup is complete.
        </p>
      </div>
    </div>
  );
}

