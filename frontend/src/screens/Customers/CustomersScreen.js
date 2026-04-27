import React,{useState,useEffect,useCallback} from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,TextInput,RefreshControl,Alert,Modal,ScrollView} from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {useTheme} from '../../context/ThemeContext';
import {customerAPI} from '../../utils/api';
import {formatCurrency,formatDate} from '../../utils/format';
import {SPACING,RADIUS} from '../../utils/theme';
import {useTranslate} from '../../hooks/useTranslate';

const TABS=['all','paid','pending','partial','overdue'];

export default function CustomersScreen(){
  const {theme:T}=useTheme();
  const {T:trans} = useTranslate();
  const [customers,setCustomers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [search,setSearch]=useState('');
  const [tab,setTab]=useState('all');
  const [addModal,setAddModal]=useState(false);
  const [settleModal,setSettleModal]=useState(false);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState({name:'',phone:'',address:''});
  const [settleAmt,setSettleAmt]=useState('');
  const [saving,setSaving]=useState(false);

  const fetchCustomers=useCallback(async()=>{
    try{ const res=await customerAPI.getAll(); setCustomers(res.data||[]); }
    catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{fetchCustomers();},[fetchCustomers]);
  const onRefresh=()=>{setRefreshing(true);fetchCustomers();};

  const filtered=customers.filter(c=>{
    const matchS=(c.name||'').toLowerCase().includes(search.toLowerCase())||(c.phone||'').includes(search);
    const matchT=tab==='all'||c.status===tab;
    return matchS&&matchT;
  });

  const totalPending=customers.reduce((s,c)=>s+(c.pending||0),0);
  const overdueCount=customers.filter(c=>c.status==='overdue').length;

  const handleAdd=async()=>{
    if(!form.name){Alert.alert('Error','Customer name is required.');return;}
    setSaving(true);
    try{ await customerAPI.create(form); await fetchCustomers(); setAddModal(false); setForm({name:'',phone:'',address:''}); }
    catch(err){Alert.alert('Error',err.response?.data?.message||'Failed to add customer.');}
    finally{setSaving(false);}
  };

  const handleSettle=async()=>{
    const amt=parseFloat(settleAmt)||0;
    if(amt<=0){Alert.alert('Error','Enter a valid amount.');return;}
    setSaving(true);
    try{ await customerAPI.settle(selected._id,amt); await fetchCustomers(); setSettleModal(false); }
    catch(err){Alert.alert('Error',err.response?.data?.message||'Settlement failed.');}
    finally{setSaving(false);}
  };

  const renderItem=({item:c})=>(
    <View style={[styles.row,{backgroundColor:T.bgCard}]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.name,{color:T.textPrimary}]}>{c.name}</Text>
        <Text style={[styles.sub,{color:T.textMuted}]}>{c.phone||'—'} · {c.address||'—'}</Text>
        <View style={styles.amtRow}>
          <Text style={[styles.amtLabel,{color:T.textMuted}]}>{trans('total_amount') || 'Billed'}: <Text style={[styles.amtVal,{color:T.textPrimary}]}>{formatCurrency(c.totalBilled||0)}</Text></Text>
          <Text style={[styles.amtLabel,{color:T.textMuted}]}>{trans('paid') || 'Paid'}: <Text style={[styles.amtVal,{color:T.green}]}>{formatCurrency(c.totalPaid||0)}</Text></Text>
          {(c.pending||0)>0&&<Text style={[styles.amtLabel,{color:T.textMuted}]}>{trans('pending_pay') || 'Pending'}: <Text style={[styles.amtVal,{color:T.amber}]}>{formatCurrency(c.pending||0)}</Text></Text>}
        </View>
        {c.updatedAt&&<Text style={[styles.date,{color:T.textMuted}]}>Last: {formatDate(c.updatedAt)}</Text>}
      </View>
      <View style={styles.rowRight}>
        <Badge status={c.status||'new'}/>
        {(c.pending||0)>0&&(
          <TouchableOpacity style={[styles.settleBtn,{backgroundColor:T.amberBg,borderColor:T.amber+'44'}]} onPress={()=>{setSelected(c);setSettleAmt('');setSettleModal(true);}}>
            <Text style={[styles.settleBtnText,{color:T.amber}]}>💳 {trans('settle_pay') || 'Settle'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return(
    <View style={[styles.container,{backgroundColor:T.bgBase}]}>
      <ScreenHeader
        title={trans('customers')}
        subtitle={`${customers.length} ${trans('customers')}`}
        action={<TouchableOpacity style={[styles.addBtn,{backgroundColor:T.green}]} onPress={()=>setAddModal(true)}><Text style={styles.addBtnText}>+ {trans('new_customer') || trans('signup')}</Text></TouchableOpacity>}
      />

      <View style={[styles.statsRow,{backgroundColor:T.bgSurface,borderBottomColor:T.border}]}>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.textPrimary}]}>{customers.length}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>{trans('total_customers')}</Text>
        </View>
        <View style={[styles.statDivider,{backgroundColor:T.border}]}/>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.amber}]}>{formatCurrency(totalPending)}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>{trans('pending_pay')}</Text>
        </View>
        <View style={[styles.statDivider,{backgroundColor:T.border}]}/>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.red}]}>{overdueCount}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>{trans('low_stock') || 'Overdue'}</Text>
        </View>
      </View>

      <View style={{padding:SPACING.md,paddingBottom:0,gap:SPACING.sm}}>
        <TextInput 
          style={[styles.searchInput,{backgroundColor:T.bgCard,borderColor:T.border,color:T.textPrimary}]} 
          placeholder="Search customers…" 
          placeholderTextColor={T.textMuted} 
          value={search} 
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
          {TABS.map(t=>(
            <TouchableOpacity key={t} style={[styles.tab,tab===t?{backgroundColor:T.accent,borderColor:T.accent}:{backgroundColor:T.bgCard,borderColor:T.border}]} onPress={()=>setTab(t)}>
              <Text style={[styles.tabText,{color:T.textSecondary},tab===t&&{color:'#fff'}]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
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
          loading?<Text style={[styles.loadText,{color:T.textMuted}]}>{trans('loading')}</Text>
          :<EmptyState icon="👥" title={customers.length===0?trans('no_data'):trans('no_data')} subtitle={customers.length===0?trans('create_first'):''}/>
        }
        contentContainerStyle={filtered.length===0?{flex:1}:{paddingBottom:80}}
        ItemSeparatorComponent={()=><View style={{height:1,backgroundColor:T.border}}/>}
      />

      <Modal visible={addModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setAddModal(false)}>
        <View style={[styles.modalContainer,{backgroundColor:T.bgBase}]}>
          <View style={[styles.modalHeader,{borderBottomColor:T.border,backgroundColor:T.bgSurface}]}>
            <Text style={[styles.modalTitle,{color:T.textPrimary}]}>{trans('signup')}</Text>
            <TouchableOpacity onPress={()=>setAddModal(false)}><Text style={[styles.modalClose,{color:T.textMuted}]}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <InputField label={trans('full_name')} placeholder="Customer name" value={form.name} onChangeText={v=>setForm({...form,name:v})} showTranslate />
            <InputField label={trans('email_addr') || 'Phone'} placeholder="10-digit phone" value={form.phone} onChangeText={v=>setForm({...form,phone:v})} keyboardType="phone-pad"/>
            <InputField label={trans('address') || 'Address'} placeholder="Address" value={form.address} onChangeText={v=>setForm({...form,address:v})} multiline/>
            <PrimaryButton title={trans('new_customer') || trans('signup')} onPress={handleAdd} loading={saving} color={T.green} style={{marginTop:SPACING.sm}}/>
          </ScrollView>
        </View>
      </Modal>

      {/* Settle Modal */}
      <Modal visible={settleModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSettleModal(false)}>
        <View style={[styles.modalContainer,{backgroundColor:T.bgBase}]}>
          <View style={[styles.modalHeader,{borderBottomColor:T.border,backgroundColor:T.bgSurface}]}>
            <Text style={[styles.modalTitle,{color:T.textPrimary}]}>Settle Payment</Text>
            <TouchableOpacity onPress={()=>setSettleModal(false)}><Text style={[styles.modalClose,{color:T.textMuted}]}>✕</Text></TouchableOpacity>
          </View>
          {selected&&(
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.settleInfo,{backgroundColor:T.bgElevated,borderColor:T.border}]}>
                <Text style={[styles.settleName,{color:T.textPrimary}]}>{selected.name}</Text>
                {[['Total Billed',formatCurrency(selected.totalBilled||0),T.textPrimary],['Already Paid',formatCurrency(selected.totalPaid||0),T.green],['Pending',formatCurrency(selected.pending||0),T.amber]].map(([l,v,c])=>(
                  <View key={l} style={styles.settleRow}><Text style={[styles.settleLabel,{color:T.textMuted}]}>{l}</Text><Text style={[styles.settleValue,{color:c}]}>{v}</Text></View>
                ))}
              </View>
              <InputField label={(trans('amt_recv') || 'Amount Receiving') + ' (₹) *'} placeholder="0.00" value={settleAmt} onChangeText={setSettleAmt} keyboardType="decimal-pad"/>
              <PrimaryButton title={trans('settle_pay') || "Confirm Settlement"} onPress={handleSettle} loading={saving} color={T.green} style={{marginTop:SPACING.sm}}/>
            </ScrollView>
          )}
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
  tabsScroll:{maxHeight:60},
  tabsRow:{paddingVertical:SPACING.md,gap:8,flexDirection:'row'},
  tab:{paddingHorizontal:18,paddingVertical:2,borderRadius:RADIUS.full,borderWidth:1},
  tabText:{fontSize:13,fontWeight:'600',paddingBottom:0,marginBottom:0},
  row:{padding:SPACING.md,flexDirection:'row',gap:SPACING.sm,marginHorizontal:SPACING.md,marginTop:SPACING.md,borderRadius:RADIUS.lg,borderWidth:1,borderColor:'transparent'},
  rowLeft:{flex:1,gap:4},
  rowRight:{alignItems:'flex-end',gap:SPACING.sm},
  name:{fontSize:16,fontWeight:'700'},
  sub:{fontSize:13},
  amtRow:{flexDirection:'row',flexWrap:'wrap',gap:SPACING.md,marginTop:6},
  amtLabel:{fontSize:12},
  amtVal:{fontWeight:'700'},
  date:{fontSize:11,marginTop:6},
  settleBtn:{borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:6,borderWidth:1},
  settleBtnText:{fontSize:12,fontWeight:'700'},
  loadText:{textAlign:'center',padding:SPACING.xl,fontSize:14},
  modalContainer:{flex:1},
  modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:SPACING.lg,borderBottomWidth:1},
  modalTitle:{fontSize:20,fontWeight:'700'},
  modalClose:{fontSize:20,padding:4},
  modalContent:{padding:SPACING.lg,paddingBottom:40},
  settleInfo:{borderRadius:RADIUS.lg,padding:SPACING.md,marginBottom:SPACING.lg,borderWidth:1,gap:SPACING.sm},
  settleName:{fontSize:18,fontWeight:'700',marginBottom:4},
  settleRow:{flexDirection:'row',justifyContent:'space-between'},
  settleLabel:{fontSize:14},
  settleValue:{fontSize:14,fontWeight:'700'},
});
