// Copyright (c) 2023 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * A utility class for constructing and deconstructing filenames that include a mimetype query string.
 */
export class FilenameWithMimetype {

    /**
     * Constructs a filename with a mimetype query string.
     * @param {string} name - The base name of the file.
     * @param {string} mimetype - The mimetype of the file.
     * @returns {string} The constructed filename with mimetype.
     */
    static construct(name, mimetype) {
        return `${name}?mimetype=${mimetype.replace('/', '-')}`;
    }

    /**
     * Deconstructs a filename to extract the base name and mimetype.
     * @param {string} filename - The filename to deconstruct.
     * @returns {{name: string, mimetype: string}} An object containing the base name and mimetype.
     */
    static deconstruct(filename) {
        const mtIndex = filename.indexOf('?mimetype=');
        const name = mtIndex > 0 ? filename.slice(0, mtIndex) : filename;
        const type = mtIndex > 0 ? filename.slice(mtIndex + 10).replace('-', '/') : 'application/octet-stream';
        return { name, type };
    }
    
}

