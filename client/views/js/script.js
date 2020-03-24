/**
 * @name addOptionHandler
 * @description Add new poll option to poll form.
 */
function addOptionHandler() {
    const newOption = document.createElement('input')
    newOption.type = 'text'
    newOption.placeholder = 'Enter poll option'
    newOption.name = 'options'
    newOption.value = ''

    document.getElementById('poll-form-options').appendChild(newOption)
}

/**
 * @name useDemoAccountHandler
 * @description Pass lobby using pre-defined credentials.
 */
function useDemoAccountHandler() {
    document.getElementById('pass-phrase-input').value =
        'wagon stock borrow episode laundry kitten salute link globe zero feed marble'
}

/**
 * @name renderChart
 * @description Renders chart to canvas.
 * @param {string} title
 * @param {array} data
 * @param {array} labels
 */
function renderChart(title, data, labels) {
    var ctx = document.getElementById('statsChart').getContext('2d')
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: title,
                    data: data,
                },
            ],
        },
    })
}
