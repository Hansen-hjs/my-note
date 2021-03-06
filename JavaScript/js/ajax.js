
/**
 * 基于`fetch`请求 [MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method 请求方法
 * @param {string} url 请求路径
 * @param {object} data 请求参数对象
 * @param {number} timeout 超时毫秒
 */
function fetchRequest(method, url, data = {}, timeout = 5000) {
    let body = null;
    let query = "";
    if (method === "GET") {
        // 解析对象传参
        for (const key in data) {
            query += `&${key}=${data[key]}`;
        }
        if (query) {
            query = "?" + query.slice(1);
        }
    } else {
        // 若后台没设置接收 JSON 则不行 需要跟 GET 一样的解析对象传参
        body = JSON.stringify(data);
    }
    return new Promise((resolve, reject) => {
        fetch(url + query, {
            // credentials: "include",  // 携带cookie配合后台用
            // mode: "cors",            // 貌似也是配合后台设置用的跨域模式
            method: method,
            headers: {
                "Content-Type": "application/json"
                // "Content-Type": "application/x-www-form-urlencoded"
            },
            body: body
        }).then(response => {
            // 把响应的信息转为`json`
            return response.json();
        }).then(res => {
            resolve(res);
        }).catch(error => {
            reject(error);
        });
        setTimeout(reject.bind(this, "fetch is timeout"), timeout);
    });
}

function clickFetchRequest() {
    fetchRequest("GET", "http://192.168.10.220:8000/bg/common/pm/category/", {
        page: 1,
        per_page: 10
    }).then(res => {
        console.log("Fetch success", res);
    }).catch(err => {
        console.warn("Fetch fail", err);
    })
}

/**
 * `XMLHttpRequest`请求 [MDN文档](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
 * @param {object} params 传参对象
 * @param {string} params.url 请求路径
 * @param {"GET"|"POST"|"PUT"|"DELETE"} params.method 请求方法
 * @param {object} params.data 传参对象（json）
 * @param {FormData|string} params.formData `form`表单式传参：上传图片就是使用这种传参方式；使用`formData`时将覆盖`data`
 * @param {{ [key: string]: string }} params.headers `XMLHttpRequest.header`设置对象
 * @param {number?} params.overtime 超时检测毫秒数
 * @param {(result?: any, response: XMLHttpRequest) => void} params.success 成功回调 
 * @param {(error?: XMLHttpRequest) => void} params.fail 失败回调 
 * @param {(info?: XMLHttpRequest) => void} params.timeout 超时回调
 * @param {(res?: ProgressEvent<XMLHttpRequestEventTarget>) => void} params.progress 进度回调（暂时没用到）
 */
function ajax(params) {
    if (typeof params !== "object") return console.error("ajax 缺少请求传参");
    if (!params.method) return console.error("ajax 缺少请求类型 GET 或者 POST");
    if (!params.url) return console.error("ajax 缺少请求 url");
    if (typeof params.data !== "object") return console.error("请求参数类型必须为 object");

    const XHR = new XMLHttpRequest();
    /** 请求方法 */
    const method = params.method;
    /** 超时检测 */
    const overtime = typeof params.overtime === "number" ? params.overtime : 0;
    /** 请求链接 */
    let url = params.url;
    /** 非`GET`请求传参 */
    let body = null;
    /** `GET`请求传参 */
    let query = "";

    // 传参处理
    if (method === "GET") {
        // 解析对象传参
        for (const key in params.data) {
            query += "&" + key + "=" + params.data[key];
        }
        if (query) {
            query = "?" + query.slice(1);
            url += query;
        }
    } else {
        body = JSON.stringify(params.data); // 若后台没设置接收 JSON 则不行，需要使用`params.formData`方式传参
    }

    // 监听请求变化；XHR.status learn: http://tool.oschina.net/commons?type=5
    XHR.onreadystatechange = function () {
        if (XHR.readyState !== 4) return;
        if (XHR.status === 200 || XHR.status === 304) {
            typeof params.success === "function" && params.success(JSON.parse(XHR.response), XHR);
        } else {
            typeof params.fail === "function" && params.fail(XHR);
        }
    }

    // 判断请求进度
    if (params.progress) {
        XHR.addEventListener("progress", params.progress);
    }

    // XHR.responseType = "json"; // 设置响应结果为`json`这个一般由后台返回指定格式，前端无配置
    // XHR.withCredentials = true;	// 是否Access-Control应使用cookie或授权标头等凭据进行跨站点请求。
    XHR.open(method, url, true);

    // 判断传参类型，`json`或者`form`表单
    if (params.formData) {
        body = params.formData;
    } else {
        // 设置一个默认为 json 请求的头配置
        XHR.setRequestHeader("Content-Type", "application/json");
    }

    // 判断设置配置头信息
    if (params.headers) {
        for (const key in params.headers) {
            const value = params.headers[key];
            XHR.setRequestHeader(key, value);
        }
    }

    // 在IE中，超时属性只能在调用 open() 方法之后且在调用 send() 方法之前设置。
    if (overtime > 0) {
        XHR.timeout = overtime;
        XHR.ontimeout = function () {
            console.warn("XMLHttpRequest 请求超时 !!!");
            XHR.abort();
            typeof params.timeout === "function" && params.timeout(XHR);
        }
    }

    XHR.send(body);
}

function ajaxRequest() {
    const error = {
        message: "",
        info: null
    }
    ajax({
        url: "http://che.qihao.lzei.com/api/app/parking",
        method: "POST",
        data: {
            appkey: "e2fb20ea3f3df33310788a4247834c93",
            token: "2a11d6d67a8b8196afbcefbac3e0a573",
            page: "1",
            limit: "7",
            longitude: "113.30764968",
            latitude: "23.1200491",
            sort: "distance",
            order: "asc"
        },
        overtime: 5000,
        success: function (res, response) {
            console.log("请求成功", res);
            console.log("原始响应数据 >>", response);
        },
        fail: function (err) {
            error.message = "接口报错，请看 network";
            error.info = err;
            if (err.response.charAt(0) == "{") {
                error.info = JSON.parse(err.response);
            }
            console.log("请求失败", error);
        },
        timeout: function (info) {
            error.message = "请求超时";
            error.info = info;
            console.log(error);
        },
        progress: function (e) {
            if (e.lengthComputable) {
                let percentComplete = e.loaded / e.total
                console.log("请求进度", percentComplete, e.loaded, e.total);
            }
            console.log(e);
        }
    });
}

(function () {
    /**
    * `http`请求
    * @dec 适用`GET`和`POST`一样的拼接参数传参
    * @param {"GET"|"POST"} method 请求方法
    * @param {string} url 请求地址
    * @param {object} data 请求参数
    * @param {(result: any) => void} success 成功回调
    * @param {(error: XMLHttpRequest) => void} fail 失败回调
    */
    function ajax(method, url, data, success, fail) {
        const XHR = new XMLHttpRequest();
        /** 请求参数 */
        let sendData = "";
        // 解析对象传参
        for (const key in data) {
            sendData += "&" + key + "=" + data[key];
        }
        switch (method) {
            case "GET":
                url = sendData ? `${url}?${sendData}` : url;
                sendData = null;
                break;

            case "POST":
                if (sendData) {
                    sendData = sendData.slice(1);
                }
                break;
        }
        XHR.onreadystatechange = function () {
            if (XHR.readyState !== 4) return;
            if (XHR.status === 200 || XHR.status === 304) {
                typeof success === "function" && success(XHR.response);
            } else {
                typeof fail === "function" && fail(XHR);
            }
        }
        XHR.open(method, url, true);
        XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        XHR.send(sendData);
    }
})();