function getTimeTalking(participant) {
  const voiceData = participant["data"].filter((data) => data["type"] == "voice");

  let timeTalking = 0;
  for (let i = 0; i < voiceData.length; i++) {
    if (voiceData[i]["action"] == "start") {
      const timeStart = new Date(voiceData[i]["time"]).getTime();
      while (voiceData[i]["action"] != "stop" && i < voiceData.length) i++;
      if (i >= voiceData.length) break;

      const timeStop = new Date(voiceData[i]["time"]).getTime();
      timeTalking += timeStop - timeStart;
    }
  }

  return timeTalking;
}

function getTimeWithCameraOn(participant) {
  const cameraData = participant["data"].filter((data) => data["type"] == "cam");

  let timeCameraOn = 0;
  for (let i = 0; i < cameraData.length; i++) {
    if (cameraData[i]["action"] == "opened") {
      let timeStop;
      const timeStart = new Date(cameraData[i]["time"]).getTime();
      while (i < cameraData.length && cameraData[i]["action"] != "closed") i++;
      if (i >= cameraData.length) {
        timeStop = new Date(participant["lastSeen"]).getTime();
      } else {
        timeStop = new Date(cameraData[i]["time"]).getTime();
      }

      timeCameraOn += timeStop - timeStart;
    }
  }

  return timeCameraOn;
}

function totalReactionsDuringCall(participant) {
  return participant["data"].filter((data) => data["type"] == "emoji").length;
}

const btn = document.getElementById('download');

btn.addEventListener('click', async () => {
  const response = await fetch("meetings data/timotej.json");
  const data = await response.json();

  // const participants = data[0]["participants"];
  const participants = data["participants"];

  const aggStats = [];
  for (let part of participants) {
    const talkNum = getTimeTalking(part);
    const camNum = getTimeWithCameraOn(part);
    const reactNum = totalReactionsDuringCall(part);

    const timeTalking = milliToHHMMSS(talkNum);
    const timeCameraOn = milliToHHMMSS(camNum);

    aggStats.push({
      "Name": part["name"],
      "First Seen At": milliToBrazilLocale(part["firstSeen"]),
      "Last Seen At": milliToBrazilLocale(part["lastSeen"]),
      "Interaction (talking)": talkNum > 0,
      "Time Talking": timeTalking,
      "Interaction (camera)": camNum > 30 * 60000,
      "Camera On During": timeCameraOn,
      "Interaction (emojis)": reactNum > 0,
      "Total Reactions": totalReactionsDuringCall(part)
    });
  }

  const csvData = csvBuilder(aggStats);
  downloadCSV(csvData);
});