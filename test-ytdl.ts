import ytdl from "ytdl-core-enhanced";
async function test() {
    try {
        const info = await ytdl.getInfo("https://www.youtube.com/watch?v=aqz-KE-bpKQ");
        console.log("SUCCESS");
        console.log(info.videoDetails.title);
    } catch (e: any) {
        console.error("YTDL ERROR:", e.message);
    }
}
test();
