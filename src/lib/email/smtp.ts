import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getSmtpConfig, type SmtpConfig } from "@/lib/email/config";

let transporter: Transporter | null = null;
let transporterKey = "";

function configKey(cfg: SmtpConfig) {
  return `${cfg.host}:${cfg.port}:${cfg.user}`;
}

export function getMailTransporter(): {
  transporter: Transporter;
  config: SmtpConfig;
} | null {
  const config = getSmtpConfig();
  if (!config) return null;

  const key = configKey(config);
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    transporterKey = key;
  }

  return { transporter, config };
}
