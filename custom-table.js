const LitElement = customElements.get('hui-masonry-view')
    ? Object.getPrototypeOf(customElements.get('hui-masonry-view'))
    : Object.getPrototypeOf(customElements.get('hui-view'));
const html       = LitElement.prototype.html;
const css        = LitElement.prototype.css;

class CustomTable extends LitElement {
    static get properties() {
        return {
            hass                 : {type: Object},
            config               : {type: Object},
            autoToggleView       : {type: Boolean},
            autoToggleViewTimerId: {type: Number},
            data                 : {type: Object},
            messages             : {type: Array},
            sensors              : {type: Array},
            view                 : {type: String},
            views                : {type: Object}
        };
    }

    static get styles() {
        return [
            css`
                ha-card {
                    padding: 2rem 1rem;
                    margin: auto;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    overflow: hidden;
                    position: relative;
                }
                ha-card h1 {
                    font-size: 1.3rem;
                    margin: 0 0 .34rem .45rem;
                    padding: 0;
                }
                ha-card table {
                    flex-grow: 1;
                }
                ha-card table tr td {
                    padding: 0 .5rem;
                }
            `
        ];
    }

    constructor() {
        super();

        this.props = {
            summary: false,
            borders: false,
            filters: false, // not in use!
        };

        this.data = {
            headers : {},
            values  : {}
        };

        this.utils = {
            isUndefined        : v => typeof v === 'undefined',
            isNull             : v => typeof v === 'object' && v === null,
            isObject           : v => typeof v === 'object' && !['null', null, undefined].includes(v) && !Object.keys(v).includes('0'),
            isArray            : v => typeof v === 'object' && !['null', null, undefined].includes(v) && Object.keys(v).includes('0'),
            isString           : v => typeof v === 'string' && `${v}`.length > 0,
            isNumber           : v => !isNaN(v),
            isBool             : v => typeof v === 'boolean' || v === true || v === false,
            isObjectEmpty      : v => this.utils.isObject(v) && Object.keys(v).length === 0,
            isArrayEmpty       : v => this.utils.isArray(v) && v.length === 0,
            isValueNotAvailable: v => {
                let array = [];
                const notAvailableValues = this.props.not_available_values || null;
                switch (typeof notAvailableValues) {
                    case 'string':
                        array = `${notAvailableValues}`.indexOf('.') !== -1
                            ? notAvailableValues.split('.')
                            : [notAvailableValues];
                        break;
                    case 'object':
                        array = this.utils.isObject(notAvailableValues)
                            ? Object.values(notAvailableValues)
                            : [];
                        break;
                    default:
                        break;
                }

                return array.includes(v);
            },
            padding            : ({ v, isPrefix, paddingNumber, paddingCharacter}) => {
                isPrefix = this.utils.isBool(isPrefix) && isPrefix;
                if (
                    !this.utils.isNumber(v)
                    || !this.utils.isNumber(paddingNumber)
                    || !this.utils.isString(paddingCharacter)
                ) {
                    return v;
                }

                const valueLength = `${v}`.length;
                const lengthDiff  = paddingNumber - valueLength;
                if (lengthDiff > 0) {
                    for (let i=0;i<lengthDiff;i++) {
                        v = isPrefix
                            ? `${paddingCharacter}${v}`
                            : `${v}${paddingCharacter}`;
                    }
                }

                return v;
            },
            statesValue: v => {
                if (this.utils.isValueNotAvailable(v)) {
                    return 'N/A';
                }

                const value = this.utils.isObject(this.hass)
                    && this.hass.hasOwnProperty('states')
                    && this.utils.isObject(this.hass.states)
                    && this.hass.states.hasOwnProperty(v)
                        ? this.hass.states[v]
                        : v;

                return this.utils.isObject(value) && value.hasOwnProperty('state')
                    ? value.state
                    : value;
            },
            setValueType: ({ v, props }) => {
                if (
                    !this.utils.isObject(props)
                    && !this.utils.isObjectEmpty(props)
                ) {
                    return v;
                }

                switch (props.type || 'text') {
                    case 'decimal':
                        if (
                            this.utils.isNumber(v)
                        ) {
                            const decimal = props.hasOwnProperty('decimal') && this.utils.isNumber(props.decimal)
                                ? props.decimal
                                : 2;

                            v = Number(v);
                            v = props.hasOwnProperty('decimal')
                                ? v.toFixed(decimal)
                                : v;

                            if (
                                props.hasOwnProperty('format')
                                && this.utils.isString(props.format)
                            ) {
                                switch (props.format.toLowerCase()) {
                                    case 'nl':
                                        v = `${v}`
                                            .replace(/,/g, '####|COMMA|####')
                                            .replace(/\./g, '####|PUNT|####')
                                            .replace(/'####\|COMMA\|####'/g, '.')
                                            .replace(/####\|PUNT\|####/g, ',');
                                        break;
                                    case 'en':
                                    default:
                                        break;
                                }
                            }
                        }
                        break;
                    case 'text':
                    default:
                        break;
                }

                return [
                    props.hasOwnProperty('prefix') ? props.prefix : '',
                    `${v}`,
                    props.hasOwnProperty('suffix') ? props.suffix : '',
                ].join(' ');
            },
            borderProperties: (borderProp, isTransparent) => {
                if (!this.utils.isString(borderProp)) {
                    return '';
                }

                isTransparent = this.utils.isBool(isTransparent) ? isTransparent : false;
                switch (`${borderProp}`.toLowerCase()) {
                    case 'top':
                    case 'left':
                    case 'right':
                    case 'bottom':
                        return `border-${borderProp}: .1rem solid ${isTransparent ? `transparent` : `var(--primary-text-color)`};`;
                    default:
                        return '';
                }
            }
        };
    }

    render() {
        return html`
            <style>
                ${this.views.styling()}
                ${
                    this.props.summary.active
                        ? `
                            table {
                                border-collapse: collapse;
                            }
                            /*
                            table tbody:last-child {
                                border-top: .1rem solid var(--primary-text-color);
                            }
                            */
                        `
                        : ''
                }
            </style>
            <ha-card>
                <h1>${this.state.title}</h1>
                ${this.views.table()}
            </ha-card>
        `;
    }

    setConfig(state) {
        state = {...state};

        this.state  = state;
        const props = state.hasOwnProperty('props') && this.utils.isObject(state.props) && !this.utils.isObjectEmpty(state.props)
            ? state.props
            : {};
        const data = state.hasOwnProperty('data') && this.utils.isObject(state.data) && !this.utils.isObjectEmpty(state.data)
            ? state.data
            : {};
        const styling = props.hasOwnProperty('styling') && this.utils.isObject(props.styling) && !this.utils.isObjectEmpty(props.styling)
            ? props.styling
            : {};

        this.setProps = {
            summary: summary => {
                const isActive = this.utils.isObject(summary)
                    && !this.utils.isObjectEmpty(summary)
                    && summary.headers !== false;

                const title  = summary.hasOwnProperty('title') ? summary.title : '';
                let headers  = [];
                if (isActive) {
                    if (this.utils.isBool(summary.headers) && summary.headers) {
                        headers = Object.keys(data.headers);
                    } else if (this.utils.isString(summary.headers)) {
                        headers = summary.headers.indexOf(',') !== -1
                            ? summary.headers.split(',')
                            : [summary.headers];
                    }
                }

                return {
                    active      : isActive,
                    title       : isActive ? title : '',
                    headers     : isActive ? headers : [],
                    data        : {},
                    excludeRows : isActive && summary.hasOwnProperty('excludeRows') && this.utils.isArray(summary.excludeRows) ? summary.excludeRows : [],
                    fontWeight  : isActive && summary.hasOwnProperty('fontWeight') ? summary.fontWeight : 'normal',
                    borders     : isActive && summary.hasOwnProperty('borders') ? summary.borders : this.styling.borders,
                };
            },
        };

        this.styling = {
            ...this.styling,
            borders   : styling.borders || false,
            textAlign : styling.textAlign || {},
        };

        this.props = {
            ...this.props,
            summary              : this.setProps.summary(props.summary || {}),
            filters              : props.filters || false,
            not_available_values : props.not_available_values || [],
        };

        this.data = {
            ...this.data,
            headers : data.headers || [],
            values  : data.values || {},
        };

        if (this.utils.isArray(this.data.values)) {
            const newValues = [];
            this.data.values.forEach(
                (valueProps, _) => {
                    if (
                        this.utils.isObject(valueProps)
                        && valueProps.hasOwnProperty('repeat')
                    ) {
                        const keys = Object.keys(valueProps);
                        if (
                            this.utils.isObject(valueProps.repeat)
                            && valueProps.repeat.hasOwnProperty('start')
                            && valueProps.repeat.hasOwnProperty('end')
                            && valueProps.repeat.hasOwnProperty('skip')
                            && valueProps.repeat.hasOwnProperty('paddingNumber')
                            && valueProps.repeat.hasOwnProperty('paddingCharacter')
                            && this.utils.isNumber(valueProps.repeat.start)
                            && this.utils.isNumber(valueProps.repeat.end)
                            && this.utils.isNumber(valueProps.repeat.paddingNumber)
                            && (this.utils.isNumber(valueProps.repeat.skip) || this.utils.isArray(valueProps.repeat.skip))
                            && (this.utils.isString(valueProps.repeat.paddingCharacter) || this.utils.isNumber(valueProps.repeat.paddingCharacter))
                            && valueProps.repeat.start < valueProps.repeat.end
                        ) {
                            const hasRepeat = keys.indexOf('repeat') !== -1;

                            if (hasRepeat) {
                                keys.splice(keys.indexOf('repeat'), 1);
                            }

                            for (let i=valueProps.repeat.start; i<=valueProps.repeat.end; i++) {
                                const repeatObject = {};
                                if (
                                    (this.utils.isNumber(valueProps.repeat.skip) && valueProps.repeat.skip !== i)
                                    || (this.utils.isArray(valueProps.repeat.skip) && !valueProps.repeat.skip.includes(i))
                                ) {
                                    keys.forEach(
                                        (key, _) => {
                                            let value = valueProps[key];
                                            if (
                                                this.utils.isString(value)
                                                && `${value}`.indexOf('{repeat}') !== -1
                                            ) {
                                                const replaceWith = this.utils.padding(
                                                    {
                                                        v                : `${i}`,
                                                        isPrefix         : true,
                                                        paddingNumber    : valueProps.repeat.paddingNumber || 1,
                                                        paddingCharacter : `${valueProps.repeat.paddingCharacter}`
                                                    }
                                                );

                                                value = value.replace(/{repeat}/g, replaceWith);
                                            } else {
                                                value = 'N/A';
                                            }

                                            repeatObject[key] = this.utils.statesValue(value);
                                        }
                                    );
                                }

                                if (
                                    this.utils.isObject(repeatObject)
                                    && !this.utils.isObjectEmpty(repeatObject)
                                ) {
                                    newValues.push(repeatObject);
                                }
                            }
                        } else {
                            const notAvailableObject = {};
                            keys.forEach(
                                (key, _) => notAvailableObject[key] = 'N/A'
                            );

                            newValues.push(notAvailableObject);
                        }
                    } else {
                        newValues.push(valueProps);
                    }
                }
            );

            this.data.values = newValues;
        }

        this.views = {
            table   : () => {
                const headerKeys = Object.keys(this.data.headers);
                this.props.summary.data = {}; // to prevent infinite sum-up.
                const values = () => Object.values(this.data.values).map(
                    (valueObject, index) => {
                        if (
                            this.utils.isObject(this.props.summary)
                            && this.props.summary.hasOwnProperty('excludeRows')
                            && !this.utils.isArrayEmpty(this.props.summary.excludeRows)
                            && this.props.summary.excludeRows.includes((index + 1))
                        ) {
                            return '';
                        }

                        return html`
                            <tr>
                                ${
                                    this.props.summary.active && this.utils.isString(this.props.summary.title)
                                            ? html`<td></td>`
                                            : ''
                                }
                                ${
                                    headerKeys.map(
                                        (key, _) => {
                                            const headerProps = this.data.headers[key];
                                            const valueProps  = headerProps.properties || {};
                                            let   value = this.utils.isObject(valueObject) && valueObject.hasOwnProperty(key)
                                                ? valueObject[key]
                                                : false;
                                            
                                            if (value !== false) {
                                                value = this.utils.statesValue(value);
                                                if (!this.utils.isValueNotAvailable(value)) {
                                                    if (this.props.summary.hasOwnProperty('data')) {
                                                        const valueIsNumeric = !isNaN(value);
                                                        if (
                                                            !this.props.summary.data.hasOwnProperty(key)
                                                            || (
                                                                this.utils.isObject(this.props.summary.data[key])
                                                                && Object.keys(this.props.summary.data[key]).length === 0
                                                            )
                                                        ) {
                                                            this.props.summary.data[key] = {
                                                                props    : valueProps,
                                                                isNumber : valueIsNumeric,
                                                                values   : [],
                                                                total    : valueIsNumeric ? 0 : '',
                                                            };
                                                        }

                                                        this.props.summary.data[key].values.push(value);

                                                        if (
                                                            this.utils.isNumber(value)
                                                            && valueIsNumeric
                                                        ) {
                                                            this.props.summary.data[key].total = this.props.summary.data[key].total + Number(value);
                                                        }
                                                    }
                                                } else {
                                                    value = 'N/A';
                                                }
                                            }

                                            value = this.utils.isValueNotAvailable(value)
                                                ? 'N/A'
                                                : this.utils.setValueType(
                                                    {
                                                        v     : `${value}`,
                                                        props : valueProps
                                                    }
                                                );
                                            
                                            return html`
                                                <td class='${key}'>${value}</td>
                                            `;
                                        }
                                    )
                                }
                            </tr>
                        `;
                    }
                );

                return html`
                    <table>
                        <tbody>
                            <tr>
                                ${
                                    this.props.summary.active && this.utils.isString(this.props.summary.title)
                                            ? html`<td></td>`
                                            : ''
                                }
                                ${
                                    Object.keys(this.data.headers).map(
                                        (headerKey, _) => {
                                            let headerProps = this.data.headers[headerKey];
                                            if (this.utils.isArray(headerProps)) {
                                                headerProps = headerProps[0];
                                            }
                                            
                                            return html`
                                                <td class='header ${headerKey}'>
                                                    ${headerProps.title}
                                                </td>
                                            `;
                                        }
                                    )
                                }
                            </tr>
                            ${values()}
                        </tbody>
                        ${this.views.summary()}
                    </table>
                `;
            },
            summary : () => {
                if (this.props.summary.active === false) {
                    return '';
                }

                const borders      = this.props.summary.borders;
                const bordersProps = {
                    value     : borders,
                    isBool    : this.utils.isBool(borders),
                    borders   : [],
                    available : ['top', 'left', 'right', 'bottom']
                };

                if (this.utils.isString(bordersProps.value)) {
                    bordersProps.borders = bordersProps.value.indexOf(',') !== -1
                        ? bordersProps.value.split(',')
                        : [bordersProps.value];
                } else if (bordersProps.isBool) {
                    bordersProps.borders = bordersProps.available;
                }

                if (this.utils.isArray(bordersProps.borders) && bordersProps.borders.length > 0) {
                    bordersProps.borders = bordersProps.borders.map(
                        (border, _) => bordersProps.available.includes(border) ? this.utils.borderProperties(border, bordersProps.isBool && !bordersProps.value) : null
                    );
                } else {
                    bordersProps.borders = [];
                }

                const summaryHeaders = this.props.summary.headers;
                const options = Object.keys(this.data.headers).map(
                    (header, _) => {
                        let value = summaryHeaders.includes(header)
                            ? this.props.summary.data[header]
                            : '';

                        if (
                            this.utils.isObject(value)
                            && value.hasOwnProperty('total')
                            && value.hasOwnProperty('props')
                        ) {
                            value = this.utils.setValueType(
                                {
                                    v     : `${value.total}`,
                                    props : value.props
                                }
                            );
                        }

                        return html`<td class="${header}" style="${bordersProps.borders.join(' ')}">${value}</td>`;
                    }
                );
                const fontWeightOptions = [
                    'bold',
                    'bolder',
                    'normal',
                    '100',
                    '200',
                    '300',
                    '400',
                    '500',
                    '600',
                    '700',
                    '800',
                    '900',
                    'unset',
                ];

                const fontWeight = fontWeightOptions.includes(this.props.summary.fontWeight)
                    ? this.props.summary.fontWeight
                    : 'normal';

                return html`
                    <tbody style="font-weight:${fontWeight};">
                        <tr>
                            ${
                                this.utils.isString(this.props.summary.title)
                                    ? html`<td style="${bordersProps.borders.join(' ')}">${this.props.summary.title}</td>`
                                    : ''
                            }
                            ${options}
                        </tr>
                    </tbody>
                `;
            },
            styling: () => {
                const styleProps = Object.keys(this.styling).map(
                    (styleProp, _) => {
                        if (this.utils.isString(styleProp)) {
                            let styleProps = this.styling[styleProp] || '';

                            switch (styleProp.toLowerCase()) {
                                case 'borders':
                                    if (styleProps === true) {
                                        styleProps = 'top,left,right,bottom';
                                    }

                                    if (this.utils.isString(styleProps)) {
                                        styleProps = `${styleProps}`.indexOf(',') !== -1
                                            ? styleProps.split(',')
                                            : [styleProps];
                                    }

                                    const chosenBorders = this.utils.isArray(styleProps)
                                        ? styleProps.map((borderProp, _) => this.utils.borderProperties(borderProp))
                                        : [];

                                    return chosenBorders.length > 0
                                        ? `
                                            table tr td {
                                                ${chosenBorders.join(' ')}
                                            }
                                        `
                                        : '';
                                case 'textalign':
                                    if (this.utils.isObject(styleProps)) {
                                        styleProps = [styleProps];
                                    }

                                    if (this.utils.isArray(styleProps)) {
                                        const directions = [
                                            'center',
                                            'end',
                                            'inherit',
                                            'initial',
                                            'justify',
                                            'left',
                                            'right',
                                            'revert',
                                            'start',
                                            'unset',
                                        ];

                                        return styleProps.map(
                                            (styleProp, _) => {
                                                if (
                                                    !this.utils.isObject(styleProp)
                                                    || this.utils.isObjectEmpty(styleProp)
                                                    || !styleProp.hasOwnProperty('headers')
                                                    || this.utils.isArray(styleProp.headers)
                                                    || (this.utils.isBool(styleProp.headers) && !styleProp.headers)
                                                ) {
                                                    return '';
                                                }

                                                let headers = null;
                                                if (this.utils.isBool(styleProp.headers) && styleProp.headers) {
                                                    headers = Object.keys(this.data.headers);
                                                } else if (this.utils.isString(styleProp.headers)) {
                                                    headers = styleProp.headers.indexOf(',') !== -1
                                                        ? styleProp.headers.split(',')
                                                        : [styleProp.headers];
                                                } else {
                                                    return '';
                                                }

                                                headers = headers
                                                    .map((header, _) => {
                                                            if (!Object.keys(this.data.headers).includes(header)) {
                                                                return '';
                                                            }

                                                            return !styleProp.hasOwnProperty('alignHeaders') || styleProp.alignHeaders === true
                                                                ? `.${header}`
                                                                : `.${header}` + ':not(.header)';
                                                        }
                                                    )
                                                    .join(', ');

                                                if (
                                                    !styleProp.hasOwnProperty('direction')
                                                    || !directions.includes(styleProp.direction)
                                                ) {
                                                    return '';
                                                }

                                                return `
                                                    ${headers} {
                                                        text-align: ${styleProp.direction}
                                                    }
                                                `;

                                            }
                                        );
                                    }

                                    return '';
                                default:
                                    return '';
                            }
                        }

                        return '';
                    }
                );

                return html`
                    <style>
                        ${styleProps}
                    </style>
                `;
            },
        };
    }

    getCardSize() {
        return 5;
    }
}

customElements.define(
    "custom-table",
    CustomTable
);