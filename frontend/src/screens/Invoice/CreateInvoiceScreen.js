import React,{useState,useEffect} from 'react';
import {View,Text,ScrollView,TouchableOpacity,StyleSheet,TextInput,Alert,KeyboardAvoidingView,Platform} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import PrimaryButton from '../../components/PrimaryButton';
import InputField from '../../components/InputField';
import {useTheme} from '../../context/ThemeContext';
import {invoiceAPI,inventoryAPI,customerAPI} from '../../utils/api';
import {formatCurrency} from '../../utils/format';
import {SPACING,RADIUS} from '../../utils/theme';
import {useTranslate} from '../../hooks/useTranslate';

const GST=[0,5,12,18,28];
const UNITS=['pcs','kg','m','l','can','roll','box','set'];
const newItem=()=>({id:Date.now().toString(),name:'',hsnCode:'',qty:'1',unit:'pcs',price:'',gst:18});

export default function CreateInvoiceScreen({navigation}){
  const {theme}=useTheme();
  const {T} = useTranslate();
  const [customer,setCustomer]=useState({name:'',phone:'',address:''});
  const [items,setItems]=useState([newItem()]);
  const [mode,setMode]=useState('cash');
  const [paid,setPaid]=useState('');
  const [notes,setNotes]=useState('');
  const [taxFree,setTaxFree]=useState(false);
  const [saving,setSaving]=useState(false);
  // Item autocomplete
  const [sugg,setSugg]=useState({idx:-1,list:[]});
  // Customer autocomplete
  const [allCustomers,setAllCustomers]=useState([]);
  const [custSugg,setCustSugg]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{ const res=await customerAPI.getAll(); setAllCustomers(res.data||[]); }
      catch{}
    })();
  },[]);

  const upd=(idx,f,v)=>setItems(p=>p.map((it,i)=>i===idx?{...it,[f]:v}:it));
  const subtotal=items.reduce((s,it)=>(parseFloat(it.price)||0)*(parseFloat(it.qty)||0)+s,0);
  const tax=taxFree?0:items.reduce((s,it)=>(parseFloat(it.price)||0)*(parseFloat(it.qty)||0)*(it.gst/100)+s,0);
  const grand=subtotal+tax;
  const balance=grand-(parseFloat(paid)||0);

  // Customer name search
  const searchCustomer=(val)=>{
    setCustomer(c=>({...c,name:val}));
    if(val.length>1){
      const matches=allCustomers.filter(c=>(c.name||'').toLowerCase().startsWith(val.toLowerCase())||(c.phone||'').includes(val)).slice(0,5);
      setCustSugg(matches);
    } else { setCustSugg([]); }
  };
  const selectCustomer=(c)=>{
    setCustomer({name:c.name||'',phone:c.phone||'',address:c.address||''});
    setCustSugg([]);
  };

  // Customer phone search
  const searchByPhone=(val)=>{
    setCustomer(c=>({...c,phone:val}));
    if(val.length>2){
      const matches=allCustomers.filter(c=>(c.phone||'').includes(val)).slice(0,5);
      if(matches.length>0) setCustSugg(matches);
    } else { setCustSugg([]); }
  };

  const searchItem=async(idx,val)=>{
    upd(idx,'name',val);
    if(val.length>1){
      try{const r=await inventoryAPI.search(val);setSugg({idx,list:(r.data||[]).slice(0,5)});}
      catch{setSugg({idx:-1,list:[]});}
    }else setSugg({idx:-1,list:[]});
  };

  const save=async()=>{
    if(!customer.name){Alert.alert('Error','Customer name required.');return;}
    if(items.some(it=>!it.name||!it.price)){Alert.alert('Error','Fill all item details.');return;}
    setSaving(true);
    try{
      await invoiceAPI.create({
        customerName:customer.name,customerPhone:customer.phone,customerAddress:customer.address,
        items:items.map(it=>({name:it.name,hsnCode:it.hsnCode,qty:parseFloat(it.qty)||1,unit:it.unit,price:parseFloat(it.price)||0,gst:taxFree?0:it.gst})),
        paymentMode:mode,amountPaid:parseFloat(paid)||0,subtotal,taxTotal:tax,grandTotal:grand,balance,
        status:balance<=0?'paid':(parseFloat(paid)||0)>0?'partial':'pending',notes,isTaxFree:taxFree,
      });
      Alert.alert('Success','Invoice created!',[{text:'OK',onPress:()=>navigation.goBack()}]);
    }catch(err){Alert.alert('Error',err.response?.data?.message||'Failed.');}
    finally{setSaving(false);}
  };

  const S=theme;
  const s=createStyles(S);

  return(
    <KeyboardAvoidingView style={[s.container,{backgroundColor:S.bgBase}]} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScreenHeader title={T('invoices')} onBack={()=>navigation.goBack()}
        action={<TouchableOpacity style={[s.saveBtn,{backgroundColor:S.accent}]} onPress={save} disabled={saving}><Text style={s.saveTxt}>{T('save')}</Text></TouchableOpacity>}/>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* ── Customer ── */}
        <Text style={[s.sec,{color:S.textPrimary}]}>{T('customers')}</Text>
        <View style={[s.card,{backgroundColor:S.bgCard,borderColor:S.border}]}>
          {/* Customer Name with autocomplete */}
          <View style={{position:'relative',zIndex:20}}>
            <Text style={[s.fl,{color:S.textSecondary}]}>{T('full_name')} *</Text>
            <TextInput style={[s.ii,{backgroundColor:S.bgElevated,borderColor:S.borderLight,color:S.textPrimary}]}
              placeholder={T('loading')} placeholderTextColor={S.textMuted}
              value={customer.name} onChangeText={searchCustomer}/>
            {custSugg.length>0&&(
              <View style={[s.drop,{backgroundColor:S.bgCard,borderColor:S.borderLight}]}>
                {custSugg.map(c=>(
                  <TouchableOpacity key={c._id} style={[s.dropItem,{borderBottomColor:S.border}]} onPress={()=>selectCustomer(c)}>
                    <Text style={[s.dropName,{color:S.textPrimary}]}>{c.name}</Text>
                    <Text style={[s.dropSub,{color:S.textMuted}]}>{c.phone||'—'} · {c.address||'—'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {/* Phone */}
          <View style={{marginTop:SPACING.sm,position:'relative',zIndex:10}}>
            <Text style={[s.fl,{color:S.textSecondary,marginTop:SPACING.sm}]}>Phone</Text>
            <TextInput style={[s.ii,{backgroundColor:S.bgElevated,borderColor:S.borderLight,color:S.textPrimary}]}
              placeholder="Phone number" placeholderTextColor={S.textMuted} keyboardType="phone-pad"
              value={customer.phone} onChangeText={searchByPhone}/>
            {custSugg.length>0&&customer.name===''&&(
              <View style={[s.drop,{backgroundColor:S.bgCard,borderColor:S.borderLight}]}>
                {custSugg.map(c=>(
                  <TouchableOpacity key={c._id} style={[s.dropItem,{borderBottomColor:S.border}]} onPress={()=>selectCustomer(c)}>
                    <Text style={[s.dropName,{color:S.textPrimary}]}>{c.name}</Text>
                    <Text style={[s.dropSub,{color:S.textMuted}]}>{c.phone||'—'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <InputField label="Address (optional)" placeholder="Address" value={customer.address} onChangeText={v=>setCustomer({...customer,address:v})} multiline/>
        </View>

        {/* ── Items ── */}
        <View style={s.itemsHeader}>
          <Text style={[s.sec,{color:S.textPrimary,marginTop:0,marginBottom:0}]}>{T('bill_items')}</Text>
          <TouchableOpacity style={[s.addRow,{backgroundColor:S.bgElevated,borderColor:S.border}]} onPress={()=>setItems(p=>[...p,newItem()])}>
            <Text style={[s.addRowTxt,{color:S.accent}]}>+ {T('add_item')}</Text>
          </TouchableOpacity>
        </View>

        {items.map((item,idx)=>{
          const lt=(parseFloat(item.price)||0)*(parseFloat(item.qty)||0);
          const ltTax=taxFree?0:lt*(item.gst/100);
          return(
            <View key={item.id} style={[s.itemCard,{backgroundColor:S.bgCard,borderColor:S.border}]}>
              <View style={s.row}>
                <View style={{flex:1,position:'relative',zIndex:100-idx}}>
                  <Text style={[s.fl,{color:S.textSecondary}]}>{T('item_name')}</Text>
                  <TextInput style={[s.ii,{backgroundColor:S.bgElevated,borderColor:S.borderLight,color:S.textPrimary}]}
                    placeholder={T('loading')} placeholderTextColor={S.textMuted} value={item.name} onChangeText={v=>searchItem(idx,v)}/>
                  {sugg.idx===idx&&sugg.list.length>0&&(
                    <View style={[s.drop,{backgroundColor:S.bgElevated,borderColor:S.borderLight}]}>
                      {sugg.list.map(sv=>(
                        <TouchableOpacity key={sv._id} style={[s.dropItem,{borderBottomColor:S.border}]}
                          onPress={()=>{
                            upd(idx,'name',sv.name);
                            upd(idx,'hsnCode',sv.hsnCode||'');
                            upd(idx,'price',String(sv.price||''));
                            upd(idx,'unit',sv.unit||'pcs');
                            setSugg({idx:-1,list:[]});
                          }}>
                          <Text style={[s.dropName,{color:S.textPrimary}]}>{sv.name}</Text>
                          <Text style={[s.dropSub,{color:S.textMuted}]}>{sv.hsnCode} · ₹{sv.price} · {sv.unit||'pcs'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{width:80}}>
                  <Text style={[s.fl,{color:S.textSecondary}]}>{T('hsn')}</Text>
                  <TextInput style={[s.ii,{backgroundColor:S.bgElevated,borderColor:S.borderLight,color:S.textPrimary}]}
                    placeholder="HSN" placeholderTextColor={S.textMuted} value={item.hsnCode} onChangeText={v=>upd(idx,'hsnCode',v)}/>
                </View>
              </View>

              {/* Qty, Unit chips, Price, GST */}
              <View style={s.row}>
                <View style={{flex:1}}>
                  <Text style={[s.fl,{color:S.textSecondary}]}>{T('qty')}</Text>
                  <TextInput style={[s.ii,{backgroundColor:S.bgElevated,borderColor:S.borderLight,color:S.textPrimary}]}
                    value={item.qty} onChangeText={v=>upd(idx,'qty',v)} keyboardType="numeric"/>
                </View>
                <View style={{width:SPACING.sm}}/>
                <View style={{flex:1}}>
                  <Text style={[s.fl,{color:S.textSecondary}]}>{T('price')} (₹)</Text>
                  <TextInput style={[s.ii,{backgroundColor:S.bgElevated,borderColor:S.borderLight,color:S.textPrimary}]}
                    placeholder="0.00" placeholderTextColor={S.textMuted} value={item.price} onChangeText={v=>upd(idx,'price',v)} keyboardType="decimal-pad"/>
                </View>
              </View>

              {/* Unit selector */}
              <View>
                <Text style={[s.fl,{color:S.textSecondary}]}>{T('unit')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,flexDirection:'row',paddingBottom:4}}>
                  {UNITS.map(u=>(
                    <TouchableOpacity key={u} style={[s.chip,{backgroundColor:S.bgElevated,borderColor:S.border},item.unit===u&&{backgroundColor:S.accent,borderColor:S.accent}]}
                      onPress={()=>upd(idx,'unit',u)}>
                      <Text style={[s.chipTxt,{color:item.unit===u?'#fff':S.textMuted}]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {!taxFree&&(
                <View>
                  <Text style={[s.fl,{color:S.textSecondary}]}>GST%</Text>
                  <View style={s.gstRow}>
                    {GST.map(r=>(
                      <TouchableOpacity key={r} style={[s.gst,{backgroundColor:S.bgElevated,borderColor:S.border},item.gst===r&&{backgroundColor:S.accent,borderColor:S.accent}]} onPress={()=>upd(idx,'gst',r)}>
                        <Text style={[s.gstTxt,{color:item.gst===r?'#fff':S.textMuted}]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={s.itemFoot}>
                <Text style={[s.lt,{color:S.accent}]}>{formatCurrency(lt+ltTax)}</Text>
                {items.length>1&&<TouchableOpacity onPress={()=>setItems(p=>p.filter((_,i)=>i!==idx))}><Text style={[s.rem,{color:S.red}]}>{T('cancel')} ✕</Text></TouchableOpacity>}
              </View>
            </View>
          );
        })}

        {/* ── Summary ── */}
        <Text style={[s.sec,{color:S.textPrimary}]}>{T('pay_summary')}</Text>
        <View style={[s.card,{backgroundColor:S.bgCard,borderColor:S.border}]}>
          <View style={s.sumRow}><Text style={[s.sumL,{color:S.textSecondary}]}>Subtotal</Text><Text style={[s.sumV,{color:S.textPrimary}]}>{formatCurrency(subtotal)}</Text></View>
          <TouchableOpacity style={s.sumRow} onPress={()=>setTaxFree(!taxFree)}>
            <View style={s.toggleRow}>
              <View style={[s.toggle,{backgroundColor:S.border},taxFree&&{backgroundColor:S.accent}]}><View style={[s.thumb,taxFree&&s.thumbOn]}/></View>
              <Text style={[s.sumL,{color:S.textSecondary}]}>Tax-Free Quotation</Text>
            </View>
            <Text style={[s.sumV,taxFree&&{color:S.textMuted}]}>{taxFree?'—':formatCurrency(tax)}</Text>
          </TouchableOpacity>
          <View style={[s.sumRow,s.grandRow,{borderTopColor:S.border}]}>
            <Text style={[s.grandL,{color:S.textPrimary}]}>{T('total_amount')}</Text>
            <Text style={[s.grandV,{color:S.textPrimary}]}>{formatCurrency(grand)}</Text>
          </View>
          <Text style={[s.fl,{color:S.textSecondary,marginTop:SPACING.md}]}>{T('status')}</Text>
          <View style={s.modeRow}>
            {['cash','online','credit'].map(m=>(
              <TouchableOpacity key={m} style={[s.modeBtn,{backgroundColor:S.bgElevated,borderColor:S.border},mode===m&&{backgroundColor:S.accentBg,borderColor:S.accent}]} onPress={()=>setMode(m)}>
                <Text style={[s.modeTxt,{color:S.textMuted},mode===m&&{color:S.accent,fontWeight:'700'}]}>{m==='cash'?'💵':m==='online'?'📲':'📋'} {m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <InputField label={T('amt_paid')} placeholder="0.00" value={paid} onChangeText={setPaid} keyboardType="decimal-pad"/>
          <View style={[s.balRow,{backgroundColor:balance>0?S.amberBg:S.greenBg}]}>
            <Text style={[s.balL,{color:balance>0?S.amber:S.green}]}>{balance>0?T('pending_pay'):'Paid'}</Text>
            <Text style={[s.balV,{color:balance>0?S.amber:S.green}]}>{formatCurrency(Math.abs(balance))}</Text>
          </View>
        </View>

        <InputField label="Notes" placeholder="..." value={notes} onChangeText={setNotes} multiline/>
        <PrimaryButton title={T('save')} onPress={save} loading={saving} style={{marginBottom:SPACING.xl}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(T){
  return StyleSheet.create({
    container:{flex:1,paddingTop:25},
    content:{padding:SPACING.md,paddingBottom:40},
    saveBtn:{borderRadius:RADIUS.md,paddingHorizontal:14,paddingVertical:7},
    saveTxt:{color:'#fff',fontSize:13,fontWeight:'700'},
    sec:{fontSize:15,fontWeight:'700',marginTop:SPACING.md,marginBottom:SPACING.sm},
    card:{borderRadius:RADIUS.lg,padding:SPACING.md,borderWidth:1,marginBottom:SPACING.sm},
    itemsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:SPACING.md,marginBottom:SPACING.sm},
    addRow:{borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:6,borderWidth:1},
    addRowTxt:{fontSize:13,fontWeight:'600'},
    itemCard:{borderRadius:RADIUS.lg,padding:SPACING.md,borderWidth:1,marginBottom:SPACING.sm,gap:SPACING.sm},
    row:{flexDirection:'row',gap:SPACING.sm},
    fl:{fontSize:11,fontWeight:'600',marginBottom:4},
    ii:{borderWidth:1,borderRadius:RADIUS.sm,paddingHorizontal:10,paddingVertical:8,fontSize:13},
    drop:{position:'absolute',top:'100%',left:0,right:0,borderWidth:1,borderRadius:RADIUS.md,zIndex:100,marginTop:2,elevation:10},
    dropItem:{padding:SPACING.sm,borderBottomWidth:1},
    dropName:{fontSize:13,fontWeight:'500'},
    dropSub:{fontSize:11},
    chip:{paddingHorizontal:10,paddingVertical:5,borderRadius:RADIUS.full,borderWidth:1},
    chipTxt:{fontSize:11,fontWeight:'600'},
    gstRow:{flexDirection:'row',flexWrap:'wrap',gap:3,marginTop:4},
    gst:{paddingHorizontal:8,paddingVertical:4,borderRadius:RADIUS.sm,borderWidth:1},
    gstTxt:{fontSize:11},
    itemFoot:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
    lt:{fontSize:13,fontWeight:'700'},
    rem:{fontSize:12},
    sumRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:SPACING.sm},
    sumL:{fontSize:14},
    sumV:{fontSize:14},
    grandRow:{borderTopWidth:1,paddingTop:SPACING.sm,marginTop:2},
    grandL:{fontSize:16,fontWeight:'700'},
    grandV:{fontSize:18,fontWeight:'700'},
    toggleRow:{flexDirection:'row',alignItems:'center',gap:10,flex:1},
    toggle:{width:36,height:20,borderRadius:10,justifyContent:'center',padding:2},
    thumb:{width:16,height:16,borderRadius:8,backgroundColor:'#fff'},
    thumbOn:{alignSelf:'flex-end'},
    modeRow:{flexDirection:'row',gap:SPACING.sm,marginBottom:SPACING.md},
    modeBtn:{flex:1,paddingVertical:10,borderRadius:RADIUS.md,borderWidth:1,alignItems:'center'},
    modeTxt:{fontSize:12,textTransform:'capitalize'},
    balRow:{flexDirection:'row',justifyContent:'space-between',padding:SPACING.md,borderRadius:RADIUS.md,marginBottom:SPACING.sm},
    balL:{fontSize:13,fontWeight:'600'},
    balV:{fontSize:15,fontWeight:'700'},
  });
}
