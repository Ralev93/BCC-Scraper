var bccScraper = function () {

    var site = 'https://www.bcc.bg',
        coordinates,

        _countOccurences = function (arr, key) {
            var counts = {};
            for (var i = 0; i < arr.length; i++) {
                var num = arr[i];
                counts[num] = counts[num] ? counts[num] + 1 : 1;
            }
            return parseInt(counts[key]);
        },

        _cleanText = function (txt) {
            txt = txt.replace('(Скрий картата)', '');
            txt = txt.replace(' дял', '');
            //txt = txt.replace(/ /g, '');
            txt = txt.replace(/[\r\n]+/g, ' ');
            //txt = txt.replace(/[\s]{2,}/g, '');
            return txt;
        };

    var getMainInfo = function (callback) {

        var data = {
            "coordinates": [coordinates],
            "lang": "2",
            "phaseID": "",
            "constructionType": "",
            "typeID": "",
            "areaFrom": "",
            "areaTo": "",
            "sMonth": "1",
            "sYear": "2000",
            "eMonth": "5",
            "eYear": "2019",
            "investorID": "",
            "architectID": "",
            "consultantID": "",
            "general_contractorID": "",
            "contractorID": "",
            "supplierID": ""
        };
        $.ajax({
            'url': site + '/coordinates.php',
            'type': 'POST',
            'data': data,
            'dataType': 'json',
            'success': function (answer) {
                callback(answer);
            }
        });
    };

    var getDetails = function (id, callback) {
        $.ajax({
            'url': site + '/index3.php?id=' + id,
            'success': function (details_html) {
                var details = parseDetails(details_html);
                callback(details);
            }
        });
    };

    var parseDetails = function (html) {
        var json = {};
        var usedKeys = [];
        var $html = $('<div />').append(html);


        var parseTable = function (key, $table) {
            if (key.length == 0) {
                key = 'Описание';
            }
            usedKeys.push(key);

            $table.find('tr').each(function () {
                var tds = $(this).find('td'),
                    column = key + ' / ' + $(tds[0]).text(),
                    $value = $(tds[1]),
                    value = $value.text();

                if ($value.find('table').length > 0) {
                    value = "";
                    $value.find('table').find('td').each(function () {
                        value += $(this).text() + " ";
                    });
                }
                if (tds.length == 1) {
                    json[_cleanText(column)] = _cleanText($(this).next().find('td').text());
                    return false;
                }
                if (tds.length == 3) {
                    json[_cleanText(key + ' дял')] = _cleanText($(tds[2]).text());
                }

                json[_cleanText(column)] = _cleanText(value);
            });
        };

        $html.find('.table-clean').each(function (index, table) {
            //$('.table-clean').each(function (index, table) {
            var key = $(table).prev('.text-info'), keyText;
            if (key.length == 0) {
                key = $(table).parent().find('.text-info');
            }
            keyText = _cleanText(key.text());

            if ($.inArray(keyText, usedKeys) > -1) {
                keyText = keyText + " " + (_countOccurences(usedKeys, keyText) + 1);
            }

            parseTable(keyText, $(table));
        });

        return json;
    };

    return {
        'run': function (_coordinates) {

            coordinates = _coordinates;

            getMainInfo(function (answer) {
                var totalCount = answer.dataSet.length;
                answer.dataSet.forEach(function (data, i) {
                    getDetails(data.id, function (details) {
                        answer.dataSet[i] = $.extend(answer.dataSet[i], details);

                        console.log('Completed %o of %o --- %o %', i + 1, totalCount, parseInt(100 * (i + 1) / totalCount));

                        if (i == (totalCount - 1)) {
                            console.log(answer.dataSet);
                            console.log("For export", JSON.stringify(answer.dataSet));
                        }
                    });
                })
            });

        },

        'debug': function () {
            console.log("The json is %o", parseDetails());
        }
    };
};

var coordinates = {
    'test': [
        ["23.316577295027603", "42.69430089533623"],
        ["23.316233972273697", "42.68900161199417"],
        ["23.325435023126122", "42.688648309976685"],
        ["23.325503686629162", "42.693947623461895"],
        ["23.316577295027603", "42.69430089533623"]
    ],
    'musagenitsa': [
        ['23.3584681', '42.6595062'],
        ['23.3589616', '42.6533675'],
        ['23.3661714', '42.6536358'],
        ['23.3650771', '42.6596482']
    ],
    'sofia': [
        ["23.262487295027603", "42.75276089533623"],
        ["23.44032", "42.68769"],
        ["23.3696", "42.60789"],
        ["23.21716", "42.68718"],
        ["23.262487295027603", "42.75276089533623"]
    ]
};

bccScraper().run(coordinates.test);