import React,{useState,useEffect,useCallback} from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,TextInput,RefreshControl,Alert,Modal,ScrollView} from 'react-native';
import Toast from 'react-native-toast-message';
import ScreenHeader from '../../components/ScreenHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {useTheme} from '../../context/ThemeContext';
import {inventoryAPI, dealerAPI} from '../../utils/api';
import {formatCurrency,formatNumber} from '../../utils/format';
import {SPACING,RADIUS} from '../../utils/theme';

const CATS=['All','Electrical','Hardware','Paint','Other'];
const UNITS=['pcs','kg','m','l','can','roll','box','set'];
const emptyForm={name:'',category:'Electrical',hsnCode:'',quantity:'',threshold:'',unit:'pcs',price:'',supplier:''};

export default function InventoryScreen(){
  const {theme}=useTheme();
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [search,setSearch]=useState('');
  const [cat,setCat]=useState('All');
  const [modal,setModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [dealers, setDealers]=useState([]);
  const [saving,setSaving]=useState(false);

  const fetchItems=useCallback(async()=>{
    try{
      const [res, dealRes]=await Promise.all([inventoryAPI.getAll(), dealerAPI.getAll()]);
      const inv=res.data||[];
      setItems(inv);
      setDealers(dealRes.data||[]);
      // ── Low stock toast alerts on load ──
      const low=inv.filter(it=>Number(it.quantity)<=Number(it.threshold));
      if(low.length>0){
        setTimeout(()=>{
          Toast.show({
            type:'error',
            text1:`⚠️ Low Stock Alert`,
            text2:`${low.length} item${low.length>1?'s are':' is'} running low: ${low.slice(0,3).map(i=>i.name).join(', ')}${low.length>3?'…':''}`,
            visibilityTime:5000,
            position:'top',
          });
        },800);
      }
    }
    catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{fetchItems();},[fetchItems]);
  const onRefresh=()=>{setRefreshing(true);fetchItems();};

  const filtered=items.filter(it=>{
    const matchS=it.name.toLowerCase().includes(search.toLowerCase())||(it.hsnCode||'').includes(search);
    const matchC=cat==='All'||it.category===cat;
    return matchS&&matchC;
  });

  const lowCount=items.filter(i=>Number(i.quantity)<=Number(i.threshold)).length;
  const totalVal=items.reduce((s,it)=>s+(it.quantity*it.price||0),0);

  const openAdd=()=>{setEditItem(null);setForm(emptyForm);setModal(true);};
  const openEdit=(item)=>{setEditItem(item);setForm({...item,quantity:String(item.quantity),threshold:String(item.threshold),price:String(item.price)});setModal(true);};

  const handleSave=async()=>{
    if(!form.name){Alert.alert('Error','Item name is required.');return;}
    setSaving(true);
    try{
      const payload={...form,quantity:Number(form.quantity),threshold:Number(form.threshold),price:Number(form.price)};
      if(editItem){
        await inventoryAPI.update(editItem._id,payload);
      } else {
        await inventoryAPI.create(payload);
        const costDiff=payload.quantity*payload.price;
        if(payload.supplier&&costDiff>0){
          const d=dealers.find(x=>x.name===payload.supplier);
          if(d){
            const newOrdered=(d.totalOrdered||0)+costDiff;
            const newPending=(d.pending||0)+costDiff;
            await dealerAPI.update(d._id,{totalOrdered:newOrdered,pending:newPending});
            // ── Dealer purchase toast alert ──
            Toast.show({
              type:'info',
              text1:'📦 Dealer Purchase Recorded',
              text2:`Bought from ${payload.supplier}: ${formatCurrency(costDiff)}`,
              visibilityTime:4000,
              position:'top',
            });
          }
        }
        // Check if newly added item is already low stock
        if(payload.quantity<=payload.threshold){
          Toast.show({
            type:'error',
            text1:'⚠️ New Stock Is Low',
            text2:`${payload.name}: only ${payload.quantity} ${payload.unit} — below threshold of ${payload.threshold}`,
            visibilityTime:5000,
            position:'top',
          });
        }
      }
      await fetchItems();
      setModal(false);
    }catch(err){Alert.alert('Error',err.response?.data?.message||'Failed to save.');}
    finally{setSaving(false);}
  };

  const handleDelete=(id)=>{
    Alert.alert('Delete Item','Are you sure you want to delete this item?',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{
        try{await inventoryAPI.delete(id);setItems(prev=>prev.filter(it=>it._id!==id));}
        catch(err){Alert.alert('Error',err.response?.data?.message||'Delete failed.');}
      }},
    ]);
  };

  const T=theme;

  const renderItem=({item})=>{
    const isLow=Number(item.quantity)<=Number(item.threshold);
    return(
      <View style={[styles.row,{backgroundColor:T.bgCard}]}>
        <View style={styles.rowMain}>
          <Text style={[styles.itemName,{color:T.textPrimary}]}>{item.name}</Text>
          <Text style={[styles.itemSub,{color:T.textMuted}]}>{item.category} · HSN: {item.hsnCode||'—'} · {item.supplier||'—'}</Text>
          <View style={styles.rowMeta}>
            <View style={[styles.qtyBadge,{backgroundColor:isLow?T.redBg:T.greenBg}]}>
              <Text style={[styles.qtyText,{color:isLow?T.red:T.green}]}>{item.quantity} {item.unit}</Text>
            </View>
            <Text style={[styles.priceText,{color:T.textMuted}]}>{formatCurrency(item.price)} each</Text>
            <Text style={[styles.valText,{color:T.textSecondary}]}>{formatCurrency(item.quantity*item.price)}</Text>
          </View>
        </View>
        <View style={styles.rowActions}>
          <Badge status={isLow?'overdue':'paid'} label={isLow?'Low Stock':'In Stock'}/>
          <View style={styles.actionBtns}>
            <TouchableOpacity style={[styles.iconBtn,{backgroundColor:T.accentBg,borderWidth:1,borderColor:T.accent+'44',borderRadius:RADIUS.sm}]} onPress={()=>openEdit(item)}><Text>✏️</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn,{backgroundColor:T.redBg,borderWidth:1,borderColor:T.red+'44',borderRadius:RADIUS.sm}]} onPress={()=>handleDelete(item._id)}><Text>🗑️</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return(
    <View style={[styles.container,{backgroundColor:T.bgBase}]}>
      <ScreenHeader
        title="Inventory"
        subtitle={`${items.length} items · ${lowCount} low stock`}
        action={<TouchableOpacity style={[styles.addBtn,{backgroundColor:T.accent}]} onPress={openAdd}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>}
      />

      <View style={[styles.statsRow,{backgroundColor:T.bgSurface,borderBottomColor:T.border}]}>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.textPrimary}]}>{formatNumber(items.length)}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>Total Items</Text>
        </View>
        <View style={[styles.statDivider,{backgroundColor:T.border}]}/>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.amber}]}>{lowCount}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>Low Stock</Text>
        </View>
        <View style={[styles.statDivider,{backgroundColor:T.border}]}/>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.green}]}>{formatCurrency(totalVal)}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>Total Value</Text>
        </View>
      </View>

      <View style={{padding:SPACING.md,paddingBottom:0,gap:SPACING.sm}}>
        <TextInput 
          style={[styles.searchInput,{backgroundColor:T.bgCard,borderColor:T.border,color:T.textPrimary}]} 
          placeholder="Search items or HSN…" 
          placeholderTextColor={T.textMuted} 
          value={search} 
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catRow}>
          {CATS.map(c=>(
            <TouchableOpacity key={c} style={[styles.catTab,cat===c?{backgroundColor:T.accent,borderColor:T.accent}:{backgroundColor:T.bgCard,borderColor:T.border}]} onPress={()=>setCat(c)}>
              <Text style={[styles.catText,{color:T.textSecondary},cat===c&&{color:'#fff'}]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i=>i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent}/>}
        ListEmptyComponent={
          loading?<Text style={[styles.loadText,{color:T.textMuted}]}>Loading…</Text>
          :<EmptyState icon="📦" title={items.length===0?'No items yet':'No items match your search'} subtitle={items.length===0?'Tap + Add to add your first item':''}/>
        }
        contentContainerStyle={filtered.length===0?{flex:1}:{paddingBottom:80}}
        ItemSeparatorComponent={()=><View style={[styles.separator,{backgroundColor:T.border}]}/>}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setModal(false)}>
        <View style={[styles.modalContainer,{backgroundColor:T.bgBase}]}>
          <View style={[styles.modalHeader,{borderBottomColor:T.border,backgroundColor:T.bgSurface}]}>
            <Text style={[styles.modalTitle,{color:T.textPrimary}]}>{editItem?'Edit Item':'Add Item'}</Text>
            <TouchableOpacity onPress={()=>setModal(false)}><Text style={[styles.modalClose,{color:T.textMuted}]}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <InputField label="Item Name *" placeholder="e.g. Anchor Wire 2.5mm" value={form.name} onChangeText={v=>setForm({...form,name:v})}/>
            <Text style={[styles.fieldLabel,{color:T.textSecondary}]}>Category</Text>
            <View style={styles.chipRow}>
              {['Electrical','Hardware','Paint','Other'].map(c=>(
                <TouchableOpacity key={c} style={[styles.chip,{backgroundColor:T.bgElevated,borderColor:T.border},form.category===c&&{backgroundColor:T.accent,borderColor:T.accent}]} onPress={()=>setForm({...form,category:c})}>
                  <Text style={[styles.chipText,{color:T.textMuted},form.category===c&&{color:'#fff',fontWeight:'600'}]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.twoCol}>
              <View style={{flex:1}}><InputField label="HSN Code" placeholder="e.g. 8544" value={form.hsnCode} onChangeText={v=>setForm({...form,hsnCode:v})}/></View>
              <View style={{width:SPACING.sm}}/>
              <View style={{flex:1}}>
                <Text style={[styles.fieldLabel,{color:T.textSecondary}]}>Unit</Text>
                <View style={styles.chipRow}>
                  {UNITS.map(u=>(
                    <TouchableOpacity key={u} style={[styles.chip,{backgroundColor:T.bgElevated,borderColor:T.border},form.unit===u&&{backgroundColor:T.accent,borderColor:T.accent}]} onPress={()=>setForm({...form,unit:u})}>
                      <Text style={[styles.chipText,{color:T.textMuted},form.unit===u&&{color:'#fff',fontWeight:'600'}]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={{flex:1}}><InputField label="Current Stock *" placeholder="0" value={form.quantity} onChangeText={v=>setForm({...form,quantity:v})} keyboardType="numeric"/></View>
              <View style={{width:SPACING.sm}}/>
              <View style={{flex:1}}><InputField label="Min Threshold *" placeholder="10" value={form.threshold} onChangeText={v=>setForm({...form,threshold:v})} keyboardType="numeric"/></View>
            </View>
            <InputField label="Unit Price (₹)" placeholder="0.00" value={form.price} onChangeText={v=>setForm({...form,price:v})} keyboardType="decimal-pad"/>
            <Text style={[styles.fieldLabel,{color:T.textSecondary}]}>Supplier (Dealer)</Text>
            {dealers.length>0?(
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow,{marginBottom:0}]}>
                <TouchableOpacity style={[styles.chip,{backgroundColor:T.bgElevated,borderColor:T.border},!form.supplier&&{backgroundColor:T.accent,borderColor:T.accent}]} onPress={()=>setForm({...form,supplier:''})}>
                  <Text style={[styles.chipText,{color:T.textMuted},!form.supplier&&{color:'#fff',fontWeight:'600'}]}>None</Text>
                </TouchableOpacity>
                {dealers.map(d=>(
                  <TouchableOpacity key={d._id} style={[styles.chip,{backgroundColor:T.bgElevated,borderColor:T.border},form.supplier===d.name&&{backgroundColor:T.accent,borderColor:T.accent}]} onPress={()=>setForm({...form,supplier:d.name})}>
                    <Text style={[styles.chipText,{color:T.textMuted},form.supplier===d.name&&{color:'#fff',fontWeight:'600'}]}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ):(
              <Text style={{color:T.textMuted,fontSize:12,marginBottom:16}}>No dealers found. Add them in Dealers screen.</Text>
            )}
            <PrimaryButton title={editItem?'Update Item':'Add Item'} onPress={handleSave} loading={saving} style={{marginTop:SPACING.xl}}/>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const styles=StyleSheet.create({
  container:{flex:1,paddingTop:25},
  addBtn:{borderRadius:RADIUS.md,paddingHorizontal:16,paddingVertical:10},
  addBtnText:{color:'#fff',fontSize:14,fontWeight:'700'},
  statsRow:{flexDirection:'row',borderBottomWidth:1,paddingVertical:SPACING.md},
  statItem:{flex:1,alignItems:'center'},
  statVal:{fontSize:20,fontWeight:'700'},
  statLbl:{fontSize:12,marginTop:4},
  statDivider:{width:1,marginVertical:4},
  searchInput:{borderWidth:1,borderRadius:RADIUS.md,paddingHorizontal:SPACING.md,paddingVertical:12,fontSize:15},
  catScroll:{maxHeight:60},
  catRow:{paddingVertical:SPACING.md,gap:8,flexDirection:'row'},
  catTab:{paddingHorizontal:18,paddingVertical:2,borderRadius:RADIUS.full,borderWidth:1},
  catText:{fontSize:13,fontWeight:'600'},
  row:{padding:SPACING.md,flexDirection:'row',gap:SPACING.sm,marginHorizontal:SPACING.md,marginTop:SPACING.md,borderRadius:RADIUS.lg,borderWidth:1,borderColor:'transparent'},
  rowMain:{flex:1,gap:4},
  rowActions:{alignItems:'flex-end',justifyContent:'space-between'},
  itemName:{fontSize:16,fontWeight:'600'},
  itemSub:{fontSize:13},
  rowMeta:{flexDirection:'row',gap:SPACING.sm,alignItems:'center',marginTop:6},
  qtyBadge:{paddingHorizontal:10,paddingVertical:5,borderRadius:RADIUS.md},
  qtyText:{fontSize:13,fontWeight:'700'},
  priceText:{fontSize:12},
  valText:{fontSize:12,fontWeight:'600'},
  actionBtns:{flexDirection:'row',gap:8,marginTop:SPACING.sm},
  iconBtn:{width:36,height:36,alignItems:'center',justifyContent:'center'},
  separator:{height:1},
  loadText:{textAlign:'center',padding:SPACING.xl,fontSize:14},
  modalContainer:{flex:1},
  modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.lg,borderBottomWidth:1},
  modalTitle:{fontSize:20,fontWeight:'700'},
  modalClose:{fontSize:20,padding:4},
  modalContent:{padding:SPACING.lg,paddingBottom:40},
  fieldLabel:{fontSize:14,fontWeight:'600',marginBottom:8},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:SPACING.md},
  chip:{paddingHorizontal:14,paddingVertical:8,borderRadius:RADIUS.full,borderWidth:1},
  chipText:{fontSize:13},
  twoCol:{flexDirection:'row'},
});
