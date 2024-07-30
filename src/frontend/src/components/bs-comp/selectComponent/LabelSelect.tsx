import { Popover, PopoverContent, PopoverTrigger } from "@/components/bs-ui/popover";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/bs-ui/input";
import { Checkbox } from "@/components/bs-ui/checkBox";
import { Label } from "@/components/bs-ui/label";
import { Pencil2Icon } from "@radix-ui/react-icons";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/bs-ui/input";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { useTranslation } from "react-i18next";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { PlusIcon } from "@radix-ui/react-icons";
import { useContext } from "react";
import { userContext } from "@/contexts/userContext";
import { createLabelApi, updateLabelApi, 
    createLinkApi, deleteLinkApi,
    deleteLabelApi
 } from "@/controllers/API/label";
import { captureAndAlertRequestErrorHoc } from "@/controllers/request";

export enum UPDATETYPE {
    DELETELINK = 'deleteLink',
    CREATELINK = 'createLink',
    UPDATENAME = 'updateName',
    CREATELABEL = 'createLabel',
    DELETELABEL = 'deleteLabel'
}

export default function LabelSelect({labels, all, children, resource, onUpdate}) {
    const [open, setOpen] = useState(false)
    const [data, setData] = useState([])
    const { user } = useContext(userContext)
    const dataRef = useRef([])
    const { message } = useToast()
    const { t } = useTranslation()
    
    useEffect(() => {
        const newData = all.map(d => {
            const res = labels.find(l => l.value === d.value)
            return res ? {...d, selected:true} : d
        })
        dataRef.current = newData
        setData(newData)
    }, [all])

    const handleEdit = (id) => {
        setData(pre => pre.map(d =>  ({...d, edit: d.value === id}) ))
    }

    const handleChecked = (id) => {
        const type = resource.type === 'assist' ? 3 : 2
        setData(pre => {
            const newData = pre.map(d => d.value === id ? {...d, selected: !d.selected} : d)
            const cur = newData.find(d => d.value === id)
            captureAndAlertRequestErrorHoc(
                (cur.selected ? createLinkApi(id, resource.id, type) : deleteLinkApi(id, resource.id, type)).then(() => {
                    onUpdate({
                        type: cur.selected ? UPDATETYPE.CREATELINK : UPDATETYPE.DELETELINK,
                        data: cur
                    })
                })
            )
            return newData
        })
    }

    const nameRef = useRef('')
    const handleChange = (e, id) => {
        nameRef.current = id ? dataRef.current.find(d => d.value === id).label : ''
        setData(pre => pre.map(d => d.value === id ? {...d, label:e.target.value} : d))
    }

    const errorRestName = (preName, id) => { //错误发生回退初值
        preName 
        ? setData(pre => pre.map(d => d.value === id ? {...d, label:nameRef.current} : d))
        : setData(pre => pre.filter(d => d.value))
    }

    const handleSave = async (e, id) => {
        if(e.key === 'Enter') {
            setData(pre => pre.map(d => d.value === id ? {...d, edit:false} : d))
            const label = data.find(d => d.value === id)
            if(label.label.length > 10) {
                errorRestName(nameRef.current, id)
                return message({ title: t('prompt'), variant: 'warning', description: '标签名不能超过10个字符' })
            }
            const err = await captureAndAlertRequestErrorHoc(updateLabelApi(id, label.label).then((res:any) => {
                setData(pre => {
                    const newData = pre.map(d => d.value ? d : {...d, label:res.name, value:res.id})
                    dataRef.current = newData
                    return newData
                })
                onUpdate({
                    type: UPDATETYPE.UPDATENAME,
                    data: label
                })
                return message({ title: t('prompt'), variant: 'success', description: id ? '修改成功' : '创建成功' })
            }))
            if(!err) {
                errorRestName(nameRef.current, id)
            }
        }
    }

    const handleDelete = (label) => {
        bsConfirm({
            title: t('prompt'),
            desc: `标签【${label.label}】正在使用中，确认删除？`,
            okTxt: t('system.confirm'),
            onOk(next) {
                captureAndAlertRequestErrorHoc(deleteLabelApi(label.value).then(() => {
                    onUpdate({
                        type: UPDATETYPE.DELETELABEL,
                        data: label
                    })
                    message({title: t('prompt'), variant: 'success', description: '删除成功'})
                }))
                next()
            }
        })
    }

    const handleOpenChange = (b) => { // 可用于整体保存
        setOpen(b)
        setData(pre => pre.map(d => ({...d, edit:false}) ))
    }

    const [keyword, setKeyword] = useState('')
    const handleSearch = (e) => {
        const key = e.target.value
        setKeyword(key)
        const newData = dataRef.current.filter(d => d.label.toUpperCase().includes(key.toUpperCase()))
        setData(newData)
    }

    const handleAdd = () => {
        if(keyword.length > 10) {
            return message({ title: t('prompt'), variant: 'warning', description: '标签名不能超过10个字符' })
        }
        createLabelApi(keyword).then((res:any) => {
            const addItem = { label:res.name, value:res.id, edit:false, selected:false }
            dataRef.current = [addItem, ...dataRef.current]
            setData([addItem])
            onUpdate({
                type: UPDATETYPE.CREATELABEL,
                data: res.name
            })
        })
    }

    return <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
            {children}
        </PopoverTrigger>
        <PopoverContent onClick={(e) => e.stopPropagation()}>
            <div>
                <SearchInput placeholder="搜索标签" value={keyword} onChange={handleSearch} className="w-[240px]"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            (!data.length && user.role === 'admin') ? handleAdd() : null
                        }
                    }}/>
            </div>
            <div className="mt-4 h-[200px] overflow-y-auto">
                {data.map(d => <div className="flex group justify-between h-8 rounded-sm hover:bg-[#F5F5F5]">
                    <div className="flex place-items-center space-x-2">
                        <Checkbox id={d.value} checked={d.selected} onCheckedChange={() => handleChecked(d.value)}/>
                        {
                            d.edit 
                            ? <Input autoFocus className="h-6" type="text" value={d.label || ''} 
                                onChange={(e) => handleChange(e, d.value)}
                                onKeyDown={(e) => handleSave(e, d.value)} />
                            : <Label htmlFor={d.value} className="cursor-pointer">{d.label}</Label>
                        }
                    </div>
                    {user.role === 'admin' && <div className="flex place-items-center space-x-4 opacity-0 group-hover:opacity-100">
                        <Pencil2Icon className="cursor-pointer" onClick={() => handleEdit(d.value)}/>
                        <Trash2 size={16} onClick={() => handleDelete(d)} className="text-gray-600 cursor-pointer" />
                    </div>}
                </div>)}
                {(!data.length && user.role === 'admin') && <div onClick={handleAdd}
                    className="flex group items-center h-8 rounded-sm bg-[#F5F5F5] cursor-pointer">
                    <PlusIcon className="mx-2 text-[#727C8F]"/>
                    <span>创建“新标签”</span>
                </div>}
            </div>  
        </PopoverContent>
    </Popover>
}