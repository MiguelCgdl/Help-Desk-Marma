import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({
    destination: (req, file, cb: any) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: Request, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG/JPEG'));
    }
};

export const upload = multer({ storage, fileFilter });