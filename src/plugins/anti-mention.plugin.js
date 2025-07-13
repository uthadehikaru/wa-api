const logger = require('../utils/logger');
const packageJson = require('../../package.json');

const antiGroupMention = async (sock, message) => {
    // whitelist group jid 
    let groupJids = ['120363399423653389@g.us', '120363025783457581@g.us'];
    if (!Object.keys(message).includes('message')) return
    if (Object.keys(message.message).includes('groupStatusMentionMessage')) {
        let key = message.key;
        let groupId = key.remoteJid;
        let participant = key.participant;
        let pushName = message.pushName || 'Anonim';

        if (groupJids.includes(groupId)) {
            logger.warn(`⚠️Group lu di tag bang (${groupId}) sama si ${pushName}[${participant}]`)
            logger.info('♻️ Otw kick ...')

            let textContent = `Cung yang kena spam *mention group* sama si dongo satu ini ☝️@${participant.split('@')[0]}`;
            textContent += `\n\n> Sent via ${packageJson.name}\n> @${packageJson.author}/${packageJson.name}.git`;

            // prepare bacotin dulu ga sih?
            await sock.sendMessage(groupId, {
                text: textContent,
                mentions: [participant]
            }, { quoted: message });

            // delete for everyone message annoying dia
            await sock.sendMessage(groupId, { delete: key })
             
            // kick ae dah
            setTimeout( async () => {
                await sock.groupParticipantsUpdate(groupId, [participant], 'remove')
                logger.info(`✅ Done kick pakcik si ${pushName}[${participant} dari grup (${groupId})`);
            }, 10_000);
        }
    }
}

module.exports = { 
    antiGroupMention
}
