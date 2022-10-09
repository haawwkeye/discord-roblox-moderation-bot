/**
 * 
 * @param {String} type
 * @param {String} url
 * @param {Document | XMLHttpRequestBodyInit | null | undefined}
 * @param {void} callback
 */
function sendhttp(type, url, body, callback)
{
    let xhr = new XMLHttpRequest();
    xhr.open(type, url, true);

    xhr.onload = () => {

        let status = xhr.status;

        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status);
        }
    };

    xhr.send();
}