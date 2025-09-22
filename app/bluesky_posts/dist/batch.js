var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import WebSocket from "ws";
//import cborToLexRecord from "@atproto/api";
import { createClient } from "@supabase/supabase-js";
import { cborDecode } from "@atproto/common";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role for writes
var supabase = createClient(supabaseUrl, supabaseKey);
var FIREHOSE_URL = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos";
var ws = new WebSocket(FIREHOSE_URL);
// Buffer config
var BATCH_SIZE = 50; // insert every 50 posts
var FLUSH_INTERVAL = 5000; // or every 5s
var buffer = [];
var flushing = false;
function flushBuffer() {
    return __awaiter(this, void 0, void 0, function () {
        var toInsert, error, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (flushing || buffer.length === 0)
                        return [2 /*return*/];
                    flushing = true;
                    toInsert = buffer.splice(0, BATCH_SIZE);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, supabase.from("posts").insert(toInsert)];
                case 2:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error("Insert error:", error);
                        buffer = toInsert.concat(buffer);
                    }
                    else {
                        console.log("Inserted ".concat(toInsert.length, " posts"));
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("Unexpected insert failure:", err_1);
                    buffer = toInsert.concat(buffer);
                    return [3 /*break*/, 5];
                case 4:
                    flushing = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Periodic flush (time-based)
setInterval(function () {
    if (buffer.length > 0)
        flushBuffer();
}, FLUSH_INTERVAL);
ws.on("open", function () {
    console.log("Connected to Bluesky firehose");
});
ws.on("message", function (data) {
    var _a, _b;
    try {
        var msg = JSON.parse(data.toString());
        if (!((_a = msg.commit) === null || _a === void 0 ? void 0 : _a.ops))
            return;
        for (var _i = 0, _c = msg.commit.ops; _i < _c.length; _i++) {
            var op = _c[_i];
            if (op.path.startsWith("app.bsky.feed.post") && op.action === "create" && op.record) {
                try {
                    var record = cborDecode(op.record);
                    if (record === null || record === void 0 ? void 0 : record.text) {
                        buffer.push({
                            content: record.text,
                            timestamp: (_b = record.createdAt) !== null && _b !== void 0 ? _b : msg.time,
                        });
                        // Flush immediately if buffer is too big
                        if (buffer.length >= BATCH_SIZE)
                            flushBuffer();
                    }
                }
                catch (err) {
                    console.error("Decode error:", err);
                }
            }
        }
    }
    catch (err) {
        console.error("Parse error:", err);
    }
});
ws.on("error", function (err) {
    console.error("WebSocket error:", err);
});
ws.on("close", function () {
    console.log("Disconnected from firehose");
});
