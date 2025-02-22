import StreamZip from "node-stream-zip";
import path from "path";
import { ElectronFile, FILE_PATH_TYPE } from "../../types/ipc";
import { FILE_PATH_KEYS } from "../../types/main";
import { uploadStatusStore } from "../stores/upload.store";
import { getElectronFile, getValidPaths, getZipFileStream } from "./fs";

export const getPendingUploads = async () => {
    const filePaths = getSavedFilePaths(FILE_PATH_TYPE.FILES);
    const zipPaths = getSavedFilePaths(FILE_PATH_TYPE.ZIPS);
    const collectionName = uploadStatusStore.get("collectionName");

    let files: ElectronFile[] = [];
    let type: FILE_PATH_TYPE;
    if (zipPaths.length) {
        type = FILE_PATH_TYPE.ZIPS;
        for (const zipPath of zipPaths) {
            files = [
                ...files,
                ...(await getElectronFilesFromGoogleZip(zipPath)),
            ];
        }
        const pendingFilePaths = new Set(filePaths);
        files = files.filter((file) => pendingFilePaths.has(file.path));
    } else if (filePaths.length) {
        type = FILE_PATH_TYPE.FILES;
        files = await Promise.all(filePaths.map(getElectronFile));
    }
    return {
        files,
        collectionName,
        type,
    };
};

export const getSavedFilePaths = (type: FILE_PATH_TYPE) => {
    const paths =
        getValidPaths(
            uploadStatusStore.get(FILE_PATH_KEYS[type]) as string[],
        ) ?? [];

    setToUploadFiles(type, paths);
    return paths;
};

export async function getZipEntryAsElectronFile(
    zipName: string,
    zip: StreamZip.StreamZipAsync,
    entry: StreamZip.ZipEntry,
): Promise<ElectronFile> {
    return {
        path: path
            .join(zipName, entry.name)
            .split(path.sep)
            .join(path.posix.sep),
        name: path.basename(entry.name),
        size: entry.size,
        lastModified: entry.time,
        stream: async () => {
            return await getZipFileStream(zip, entry.name);
        },
        blob: async () => {
            const buffer = await zip.entryData(entry.name);
            return new Blob([new Uint8Array(buffer)]);
        },
        arrayBuffer: async () => {
            const buffer = await zip.entryData(entry.name);
            return new Uint8Array(buffer);
        },
    };
}

export const setToUploadFiles = (type: FILE_PATH_TYPE, filePaths: string[]) => {
    const key = FILE_PATH_KEYS[type];
    if (filePaths) {
        uploadStatusStore.set(key, filePaths);
    } else {
        uploadStatusStore.delete(key);
    }
};

export const setToUploadCollection = (collectionName: string) => {
    if (collectionName) {
        uploadStatusStore.set("collectionName", collectionName);
    } else {
        uploadStatusStore.delete("collectionName");
    }
};

export const getElectronFilesFromGoogleZip = async (filePath: string) => {
    const zip = new StreamZip.async({
        file: filePath,
    });
    const zipName = path.basename(filePath, ".zip");

    const entries = await zip.entries();
    const files: ElectronFile[] = [];

    for (const entry of Object.values(entries)) {
        const basename = path.basename(entry.name);
        if (entry.isFile && basename.length > 0 && basename[0] !== ".") {
            files.push(await getZipEntryAsElectronFile(zipName, zip, entry));
        }
    }

    return files;
};
