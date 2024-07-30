import { ArrowRightIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from ".";
import { useEffect, useRef, useState } from "react";
import { LoadIcon } from "@/components/bs-icons";
import { Input } from "../input";

/**
 * Cascader 组件支持以下属性：

placeholder (string, 可选): 输入框的占位符。
defaultValue (string[], 可选): 默认选中的值数组。
options (Option[], 必填): 可选项的数据源，支持多层级嵌套。
loadData (function, 可选): 异步加载数据的回调函数，接收一个选中的Option对象。
onChange (function, 可选): 当选中的值变化时的回调函数，接收两个参数，分别是选中的值数组和选中的Option数组。
 */

interface Option {
    value: string;
    label: string;
    children?: Option[];
    isLeaf?: boolean;
}

interface IProps {
    placholder?: string,
    defaultValue?: Option[],
    options: Option[],
    loadData?,
    onChange,
    selectClass?,
    selectPlaceholder?
}

const Item = (props: {
    isAsync: boolean,
    value: string,
    option: Option,
    onHover: (o: Option, isLeaf: boolean) => void,
    onClick: (o: Option, isLeaf: boolean) => void
}) => {
    const { isAsync, value, option, onHover, onClick } = props
    const [loading, setLoading] = useState(false)
    const isLeaf = option.isLeaf === false ? option.isLeaf : !option.children || option.children.length === 0

    const handleClick = () => {
        const _isAsync = isAsync && !(option.children && option.children.length !== 0) // 需要异步加载
        _isAsync && !isLeaf && setLoading(true)
        onClick(option, isLeaf)
    }

    useEffect(() => {
        setLoading(false)
    }, [option.children])

    return <div
        data-focus={value === option.value}
        className="relative flex justify-between w-full select-none items-center rounded-sm p-1.5 text-sm outline-none cursor-pointer hover:bg-[#EBF0FF] data-[focus=true]:bg-[#EBF0FF] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        onMouseEnter={() => onHover(option, isLeaf)}
        onClick={handleClick}>
        <span className="w-28 overflow-hidden text-ellipsis">{option.label}</span>
        {!isLeaf && (loading ? <LoadIcon className="text-foreground" /> : <ChevronRightIcon />)}
    </div>
}

const Col = (props: {
    isAsync: boolean,
    value: string,
    options: Option[],
    onHover: (o: Option, isLeaf: boolean) => void,
    onClick: (o: Option, isLeaf: boolean) => void
}) => {
    const { options, ...opros } = props
    return <div className="w-36 border-l first:border-none">
        {
            options.map(option => <Item {...opros} option={option} key={option.value} />)
        }
    </div>
}

const resetCols = (values, options) => {
    const vals = [options]
    let currentOptions = options
    values.forEach(dfval => {
        const option = currentOptions.find(op => op.value === dfval.value)
        if (option) {
            currentOptions = option.children || []
            option.children && vals.push(currentOptions)
        }
    })
    return vals
}

export default function Cascader({ selectClass = '', selectPlaceholder = '', defaultValue = [], options, loadData, onChange }: IProps) {

    const [open, setOpen] = useState(false)
    const [values, setValues] = useState<any>(defaultValue)
    const [isHover, setIsHover] = useState(false)
    useEffect(() => {
        !open && setIsHover(false)
    }, [open])
    console.log('values :>> ', values, defaultValue);

    const [cols, setCols] = useState(() => resetCols(defaultValue, options))


    const selectOptionsRef = useRef([])
    const handleHover = (option, isLeaf, colIndex) => {
        setIsHover(true)
        // // setValues([]) // 从新选择清空值
        const isAsync = loadData && !(option.children && option.children.length !== 0) // 需要异步加载
        if (!(isAsync || isLeaf)) {
            setCols(cols => {
                const newCols = [...cols].slice(0, colIndex + 1)
                newCols[colIndex + 1] = option.children
                return newCols
            })
        }
        // 记录链
        selectOptionsRef.current.splice(colIndex + 1)
        selectOptionsRef.current[colIndex] = option
    }

    // options -> cols
    useEffect(() => {
        updateCols.current?.(options)
        updateCols.current = null
    }, [options])
    // 更新函数
    const updateCols = useRef(null)
    const handleClick = (option, isLeaf) => {
        if (!isLeaf) {
            const isAsync = loadData && !(option.children && option.children.length !== 0)
            if (!isAsync) return

            const selectOptions = selectOptionsRef.current
            updateCols.current = (options) => {
                setCols(resetCols(selectOptions, options))
            }
            // 加载数据
            return loadData(option)
        }
        const vals = selectOptionsRef.current.map(el => el.value)
        setValues([...selectOptionsRef.current])
        onChange?.(vals, selectOptionsRef.current)
        setOpen(false)
    }

    return <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger className={selectClass}>
            <Input className="border-none bg-transparent" placeholder={selectPlaceholder} readOnly value={values.map(el => el.label).join('/')} />
            {/* <SelectValue placeholder={selectPlaceholder} >123</SelectValue> */}
        </SelectTrigger>
        <SelectContent auto>
            <div className="flex ">
                {
                    cols.map((_options, index) => {
                        return <Col
                            isAsync={loadData}
                            value={isHover ? '' : values[index]?.value || ''}
                            options={_options}
                            onHover={(op, isLeaf) => handleHover(op, isLeaf, index)}
                            onClick={handleClick}
                            key={index}
                        />
                    })
                }
            </div>
        </SelectContent>
    </Select>
};



// test

// const optionLists = [
//     {
//         value: 'zhejiang',
//         label: 'Zhejiang',
//         children: [
//             {
//                 value: 'hangzhou',
//                 label: 'Hangzhou',
//                 children: [
//                     {
//                         value: 'xihu',
//                         label: 'West Lake',
//                     },
//                 ],
//             },
//         ],
//     },
//     {
//         value: 'jiangsu',
//         label: 'Jiangsu',
//         children: [
//             {
//                 value: 'nanjing',
//                 label: 'Nanjing',
//                 children: [
//                     {
//                         value: 'zhonghuamen',
//                         label: 'Zhong Hua Men',
//                     },
//                 ],
//             },
//         ],
//     },
// ];

// const [options, setOptions] = useState(optionLists);


// const handleChange = (value, option) => {
//     console.log('object :>> ', value, option);
//     // [1,2], [{id: 1, id： 2}]
// }

// const handleLoadData = (targetOption) => {

//     // load options lazily
//     setTimeout(() => {
//         targetOption.children = [
//             {
//                 label: `${targetOption.label} Dynamic 1`,
//                 value: 'dynamic1',
//             },
//             {
//                 label: `${targetOption.label} Dynamic 2`,
//                 value: 'dynamic2',
//             },
//         ];
//         setOptions([...options]);
//     }, 1000);
// }

// <Cascader options={options} loadData={handleLoadData} onChange={handleChange} />

