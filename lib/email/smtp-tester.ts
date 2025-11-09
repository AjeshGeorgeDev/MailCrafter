/**
 * SMTP Connection Tester
 * Tests SMTP connections with detailed diagnostics
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { SMTPConfig } from "@/lib/validations/smtp";

export interface SMTPTestResult {
  success: boolean;
  connectionTime: number; // milliseconds
  authentication: "success" | "failed" | "not_tested";
  ssl: {
    valid: boolean;
    issuer: string | null;
    expiresAt: Date | null;
  };
  error?: string;
  details: string;
}

/**
 * Test SMTP Connection
 * Verifies connection, authentication, and SSL certificate
 */
export async function testSMTPConnection(
  config: SMTPConfig,
  timeout: number = 10000
): Promise<SMTPTestResult> {
  const startTime = Date.now();
  let transporter: Transporter | null = null;

  try {
    // Build transporter configuration
    const transporterConfig: any = {
      host: config.host,
      port: config.port,
      secure: config.encryption === "SSL", // SSL uses secure: true
      auth: {
        user: config.username,
        pass: config.password,
      },
      connectionTimeout: timeout,
      greetingTimeout: timeout,
      socketTimeout: timeout,
    };

    // For TLS, we need to set requireTLS
    if (config.encryption === "TLS") {
      transporterConfig.requireTLS = true;
      transporterConfig.secure = false; // TLS uses secure: false
    }

    // For NONE, disable security
    if (config.encryption === "NONE") {
      transporterConfig.secure = false;
      transporterConfig.requireTLS = false;
      transporterConfig.ignoreTLS = true;
    }

    // Create transporter
    transporter = nodemailer.createTransport(transporterConfig);

    // Test connection and authentication
    const verifyResult = await Promise.race([
      transporter.verify(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), timeout)
      ),
    ]);

    const connectionTime = Date.now() - startTime;

    // Get SSL certificate info if available
    let sslInfo = {
      valid: false,
      issuer: null as string | null,
      expiresAt: null as Date | null,
    };

    // Try to get certificate info (this is best-effort)
    try {
      // Note: Nodemailer doesn't expose certificate info directly
      // We can infer from the connection success
      if (config.encryption === "SSL" || config.encryption === "TLS") {
        sslInfo.valid = true; // If verify() succeeded, SSL/TLS is valid
      }
    } catch (certError) {
      // Certificate validation failed
      sslInfo.valid = false;
    }

    return {
      success: true,
      connectionTime,
      authentication: "success",
      ssl: sslInfo,
      details: `Successfully connected to ${config.host}:${config.port} in ${connectionTime}ms. Authentication successful.`,
    };
  } catch (error: any) {
    const connectionTime = Date.now() - startTime;
    let errorMessage = "Unknown error";
    let authentication: "success" | "failed" | "not_tested" = "not_tested";

    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed. Please check your username and password.";
      authentication = "failed";
    } else if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
      errorMessage = `Connection timeout after ${timeout}ms. Check your host and port settings.`;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Connection refused. Check if the SMTP server is running and accessible.";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = `Host not found: ${config.host}. Check your hostname.`;
    } else if (error.code === "ECONNRESET") {
      errorMessage = "Connection was reset by the server.";
    } else if (error.code === "EPROTO" || error.message?.includes("SSL") || error.message?.includes("TLS")) {
      errorMessage = "SSL/TLS error. Check your encryption settings.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      connectionTime,
      authentication,
      ssl: {
        valid: false,
        issuer: null,
        expiresAt: null,
      },
      error: errorMessage,
      details: `Failed to connect to ${config.host}:${config.port}. ${errorMessage}`,
    };
  } finally {
    // Close transporter if it was created
    if (transporter) {
      try {
        transporter.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
}

/**
 * Send Test Email
 * Sends a test email to verify the SMTP configuration works end-to-end
 */
export async function sendTestEmail(
  config: SMTPConfig,
  testEmailAddress: string,
  timeout: number = 10000
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporterConfig: any = {
      host: config.host,
      port: config.port,
      secure: config.encryption === "SSL",
      auth: {
        user: config.username,
        pass: config.password,
      },
      connectionTimeout: timeout,
      greetingTimeout: timeout,
      socketTimeout: timeout,
    };

    if (config.encryption === "TLS") {
      transporterConfig.requireTLS = true;
      transporterConfig.secure = false;
    }

    if (config.encryption === "NONE") {
      transporterConfig.secure = false;
      transporterConfig.requireTLS = false;
      transporterConfig.ignoreTLS = true;
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const mailOptions = {
      from: `"${config.fromEmail}" <${config.fromEmail}>`,
      to: testEmailAddress,
      subject: "Test Email from MailCrafter",
      html: `
        <html>
          <body>
            <h2>Test Email</h2>
            <p>This is a test email sent from MailCrafter to verify your SMTP configuration.</p>
            <p>If you received this email, your SMTP settings are working correctly!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Sent at: ${new Date().toISOString()}<br>
              SMTP Host: ${config.host}:${config.port}
            </p>
          </body>
        </html>
      `,
      text: `This is a test email sent from MailCrafter to verify your SMTP configuration.\n\nIf you received this email, your SMTP settings are working correctly!\n\nSent at: ${new Date().toISOString()}\nSMTP Host: ${config.host}:${config.port}`,
    };

    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Send timeout")), timeout)
      ),
    ]);

    transporter.close();

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    let errorMessage = "Failed to send test email";

    if (error.code === "EAUTH") {
      errorMessage = "Authentication failed";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Send timeout";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

