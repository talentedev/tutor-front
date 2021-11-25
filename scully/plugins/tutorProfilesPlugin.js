"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scully_1 = require("@scullyio/scully");
const environment_prod_1 = require("../../src/environments/environment.prod");
const environment_stage_1 = require("../../src/environments/environment.stage");
exports.tutorProfilesPlugin = async (route, config) => {
    console.log('PROD', config.prod);
    return new Promise((resolve, reject) => {
        scully_1.httpGetJson(`${config.prod ? environment_prod_1.environment.API_HOST : environment_stage_1.environment.API_HOST}/search`).then((result) => {
            const routes = result.tutors.map((tutor) => {
                return { route: `/main/tutor/${tutor._id}` };
            });
            resolve(routes);
        }).catch(err => {
            console.error(err);
            reject(err);
        });
    });
};
//# sourceMappingURL=tutorProfilesPlugin.js.map