import { createClient } from "@clickhouse/client";
class ClickHouseService {
  constructor() {
    this.client = createClient({
      url: process.env.CLICKHOUSE_URL,
      database: "default",
      username: process.env.CLICKHOUSE_USERNAME,
      password: process.env.CLICKHOUSE_PASSWORD,
    });
  }

  getClient() {
    return this.client;
  }

  retrieveLogs = async (transcode_id) => {
    try {
      const data = await this.client.query({
        query: `SELECT * FROM log_events WHERE transcode_id='${transcode_id}'`,
      });
      return data.json();
    } catch (error) {
      console.log("Unable to retrieve logs : ", error);
    }
  };
}

export { ClickHouseService };
