import nodemailer from 'nodemailer';

export const sendTicketResolutionEmail = async (to: string, ticketNumber: string, comments: string, companyName: string, totalCost: number, requiresInvoice: boolean) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    if (!process.env.SMTP_USER) {
        console.log(`[MAILER MOCK] Correo de RESOLUCIÓN a ${to} (#${ticketNumber}) - Costo: $${totalCost}`);
        return true; 
    }

    const mailOptions = {
        from: `"Marmacore Support" <${process.env.SMTP_USER}>`,
        to,
        subject: `Ticket Resuelto: #${ticketNumber}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #00272e; max-w: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #00272e; padding: 30px; text-align: center;">
                    <h1 style="color: #FD5200; margin: 0; font-size: 24px;">Ticket Resuelto</h1>
                </div>
                <div style="padding: 40px; background-color: #ffffff;">
                    <p style="font-size: 16px;">Hola <strong>${companyName}</strong>,</p>
                    <p>Le informamos que el ticket folio <strong>#${ticketNumber}</strong> ha sido resuelto con éxito.</p>
                    
                    <div style="background-color: #f8fafb; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #d5eff2;">
                        <h3 style="margin-top: 0; color: #006D65; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Resumen de Costos</h3>
                        <p style="font-size: 28px; font-weight: bold; color: #00272e; margin: 10px 0;">$${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span style="font-size: 12px; color: #94A3B8; font-weight: normal;">(Total Inc. IVA si aplica)</span></p>
                        <p style="font-size: 12px; color: #006D65;">${requiresInvoice ? 'Este ticket incluye IVA (16%) para facturación.' : 'Ticket sin requerimiento de factura.'}</p>
                    </div>

                    ${comments ? `
                    <div style="border-left: 4px solid #FD5200; padding-left: 20px; margin: 25px 0;">
                        <p style="font-size: 12px; font-weight: bold; color: #94A3B8; text-transform: uppercase;">Notas del Técnico:</p>
                        <p style="font-style: italic; color: #444; line-height: 1.6;">"${comments}"</p>
                    </div>
                    ` : ''}

                    <p style="font-size: 14px; line-height: 1.6; color: #666;">
                        Puede descargar los detalles completos de la intervención y su historial de servicios desde su panel de control en Marmacore.
                    </p>
                </div>
                <div style="background-color: #f8fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="font-size: 11px; color: #94A3B8; margin: 0;">Marmacore S.A de C.V. - Soporte Técnico Especializado</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return false;
    }
};

export const sendNewTicketEmail = async (to: string, ticketNumber: string, companyName: string, description: string) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    if (!process.env.SMTP_USER) {
        console.log(`[MAILER MOCK] Correo de NUEVO TICKET a ${to} (#${ticketNumber})`);
        return true; 
    }

    const mailOptions = {
        from: `"Marmacore HelpDesk" <${process.env.SMTP_USER}>`,
        to,
        subject: `Nuevo Ticket Registrado: #${ticketNumber}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #00272e; max-w: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #FD5200; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Ticket Registrado</h1>
                </div>
                <div style="padding: 40px; background-color: #ffffff;">
                    <p style="font-size: 16px;">Hola <strong>${companyName}</strong>,</p>
                    <p>Hemos recibido su reporte correctamente. Su número de seguimiento es:</p>
                    
                    <div style="background-color: #00272e; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #FD5200; letter-spacing: 2px;">#${ticketNumber}</span>
                    </div>

                    <p style="font-size: 14px; font-weight: bold; color: #006D65; margin-bottom: 5px;">Descripción del Problema:</p>
                    <p style="font-size: 14px; color: #666; background: #f9f9f9; padding: 15px; border-radius: 8px;">${description}</p>

                    <p style="font-size: 14px; margin-top: 30px; line-height: 1.6;">
                        Nuestro equipo técnico ha sido notificado y comenzará a trabajar en su solicitud a la brevedad posible. 
                        Podrá consultar el estatus en tiempo real usando este número de folio.
                    </p>
                </div>
                <div style="background-color: #f8fafb; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="font-size: 11px; color: #94A3B8; margin: 0;">Gracias por confiar en el soporte técnico de Marmacore.</p>
                </div>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return false;
    }
};
