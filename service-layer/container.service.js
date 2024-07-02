import { exec } from "child_process";
import { getECSClient, getECSRunTaskCommand } from "../utils/helper.js";
class ContainerService {
  async runContainer(identityName, fileKey) {
    const envMode = process.env.NODE_ENV;
    if (envMode === "development") {
      const executionCommand = getDevContainerExecutionCommand(
        identityName,
        fileKey
      );

      // execute procedure
      const proc = exec(executionCommand);

      proc.stdout.on("error", async function (data) {
        console.log("Docker Container Error", data.toString());
      });
      proc.stdout.on("data", async function (data) {
        console.log("Docker stdout: " + data.toString());
      });
      proc.on("close", async function () {
        console.log("Docker Process Closed");
      });
    } else {
      //production
      const ecsClient = getECSClient();
      const command = getECSRunTaskCommand(fileKey);
      await ecsClient.send(command);
    }
  }
}
export { ContainerService };
