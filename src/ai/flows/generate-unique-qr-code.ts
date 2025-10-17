'use server';

/**
 * @fileOverview Generates a unique QR code for each student.
 *
 * - generateUniqueQrCode - A function that generates a unique QR code for a student.
 * - GenerateUniqueQrCodeInput - The input type for the generateUniqueQrCode function.
 * - GenerateUniqueQrCodeOutput - The return type for the generateUniqueQrCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import QRCode from 'qrcode';

const GenerateUniqueQrCodeInputSchema = z.object({
  studentId: z.string().describe('The unique identifier for the student.'),
  baseUrl: z.string().describe('The base URL for the QR code to redirect to.'),
});
export type GenerateUniqueQrCodeInput = z.infer<
  typeof GenerateUniqueQrCodeInputSchema
>;

const GenerateUniqueQrCodeOutputSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      'The QR code as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // eslint-disable-line prettier/prettier
    ),
});
export type GenerateUniqueQrCodeOutput = z.infer<
  typeof GenerateUniqueQrCodeOutputSchema
>;

export async function generateUniqueQrCode(
  input: GenerateUniqueQrCodeInput
): Promise<GenerateUniqueQrCodeOutput> {
  return generateUniqueQrCodeFlow(input);
}

const generateUniqueQrCodeFlow = ai.defineFlow(
  {
    name: 'generateUniqueQrCodeFlow',
    inputSchema: GenerateUniqueQrCodeInputSchema,
    outputSchema: GenerateUniqueQrCodeOutputSchema,
  },
  async input => {
    const qrCodeDataUri = await QRCode.toDataURL(`${input.baseUrl}/q/${input.studentId}`);
    return {qrCodeDataUri};
  }
);
