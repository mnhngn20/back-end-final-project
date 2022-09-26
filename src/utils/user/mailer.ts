import { createTransport } from "nodemailer";

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.CSPACE_EMAIL,
        pass: process.env.CSPACE_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.CSPACE_EMAIL,
      to,
      subject,
      text,
    });
  } catch (error) {
    throw new Error(error);
  }
};
