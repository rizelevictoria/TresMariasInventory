const db = require('../config/db');

class Post {
    constructor(title, body) {
        this.title = title;
        this.body = body;
    }

    async save() {
        let d = new Date();
        let yyyy = d.getFullYear();
        let mm = d.getMonth() + 1;
        let dd = d.getDate();
        
        let createAtDate = `${yyyy}-${mm}-${dd}`;

        let sql = `
        INSERT INTO posts(
            title,
            body,
            created_at
        )
        VALUES(
            '${this.title}',
            '${this.body}',
            '${createAtDate}'
        )
        `;

        const [newPost, _] = await db.execute(sql);

        return newPost;
    }

    static findAll() {
    }
}