const fs = require('node:fs');
const path = require('path');
const nodecron = require('node-cron');

module.exports = (client) => {
	const tasksPath = path.join(__dirname, '../tasks');
	const taskFiles = fs.readdirSync(tasksPath).filter((file) => file.endsWith('.js'));

	for (const file of taskFiles) {
		const filePath = path.join(tasksPath, file);
		const task = require(filePath);

		if (task.name) {
			nodecron.schedule(task.cron, () => {
				task.execute(client);
			});
			task.execute(client);
		}
	}
};
