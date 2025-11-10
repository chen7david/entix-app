import { HttpService } from "../services/http.service";
import { UserService } from "../services/user.service";

export class Factory {
  static v1baseURL = "/api/v1";

  static createV1HttpService(): HttpService {
    return new HttpService(this.v1baseURL);
  }

  static createUserService(httpService?: HttpService): UserService {
    if (!httpService) {
      httpService = this.createV1HttpService();
    }
    return new UserService(httpService);
  }
}
