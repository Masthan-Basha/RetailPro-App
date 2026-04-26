import React,{useState,useEffect,useCallback} from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,TextInput,RefreshControl,Alert,Modal,ScrollView,ActivityIndicator} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ScreenHeader from '../../components/ScreenHeader';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import {useTheme} from '../../context/ThemeContext';
import {dealerAPI,invoiceAPI} from '../../utils/api';
import {formatCurrency,formatDate} from '../../utils/format';
import {buildInvoiceHtml} from '../../utils/invoiceHtml';
import {SPACING,RADIUS} from '../../utils/theme';
import { Feather } from '@expo/vector-icons';
import {useAuth} from '../../context/AuthContext';

export default function DealersScreen(){
  const {theme:T}=useTheme();
  const {user}=useAuth();
  const [dealers,setDealers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [search,setSearch]=useState('');
  const [tab,setTab]=useState('all');
  const [addModal,setAddModal]=useState(false);
  const [settleModal,setSettleModal]=useState(false);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState({name:'',phone:'',gst:'',category:'Electrical',totalOrdered:'',totalPaid:''});
  const [settleAmt,setSettleAmt]=useState('');
  const [saving,setSaving]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [pdfLoading,setPdfLoading]=useState(null); // holds dealer._id while generating

  const openAdd=()=>{setEditingId(null);setForm({name:'',phone:'',gst:'',category:'Electrical',totalOrdered:'',totalPaid:''});setAddModal(true);};
  const openEdit=(d)=>{setEditingId(d._id);setForm({name:d.name||'',phone:d.phone||'',gst:d.gst||'',category:d.category||'Electrical',totalOrdered:d.totalOrdered?.toString()||'0',totalPaid:d.totalPaid?.toString()||'0'});setAddModal(true);};

  const fetchDealers=useCallback(async()=>{
    try{ const res=await dealerAPI.getAll(); setDealers(res.data||[]); }
    catch(e){console.error(e);}
    finally{setLoading(false);setRefreshing(false);}
  },[]);

  useEffect(()=>{fetchDealers();},[fetchDealers]);
  const onRefresh=()=>{setRefreshing(true);fetchDealers();};

  const filtered=dealers.filter(d=>{
    const matchS=(d.name||'').toLowerCase().includes(search.toLowerCase())||(d.phone||'').includes(search)||(d.gst||'').toLowerCase().includes(search.toLowerCase());
    const matchT=tab==='all'||d.status===tab;
    return matchS&&matchT;
  });

  const totalPending=dealers.reduce((s,d)=>s+(d.pending||0),0);

  const handleAdd=async()=>{
    if(!form.name){Alert.alert('Error','Dealer name is required.');return;}
    setSaving(true);
    try{
      if(editingId){ await dealerAPI.update(editingId,form); }
      else { await dealerAPI.create(form); }
      await fetchDealers(); setAddModal(false);
      setForm({name:'',phone:'',gst:'',category:'Electrical',totalOrdered:'',totalPaid:''});
      setEditingId(null);
    }
    catch(err){Alert.alert('Error',err.response?.data?.message||'Failed to save dealer.');}
    finally{setSaving(false);}
  };

  const handleDelete=(id)=>{
    Alert.alert('Delete Dealer','Are you sure you want to delete this dealer?',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{
        try{ await dealerAPI.delete(id); await fetchDealers(); }
        catch(err){ Alert.alert('Error','Failed to delete dealer'); }
      }}
    ]);
  };

  const handleSettle=async()=>{
    const amt=parseFloat(settleAmt)||0;
    if(amt<=0){Alert.alert('Error','Enter a valid amount.');return;}
    setSaving(true);
    try{ await dealerAPI.settle(selected._id,amt); await fetchDealers(); setSettleModal(false); }
    catch(err){Alert.alert('Error',err.response?.data?.message||'Payment failed.');}
    finally{setSaving(false);}
  };

  // ── PDF Download: all invoices purchased from this dealer ──
  const handleDealerPdf=async(dealer)=>{
    setPdfLoading(dealer._id);
    try{
      const res=await invoiceAPI.getAll();
      const allInvoices=res.data||[];
      // We generate a summary PDF listing all invoices linked to this dealer as supplier
      const shopName=user?.shopName||'RetailPro Store';
      const date=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});

      // Build HTML for dealer statement
      const rowsHtml=allInvoices.length>0
        ? allInvoices.map((inv,i)=>`
          <tr>
            <td>${i+1}</td>
            <td style="font-weight:600;color:#2563eb">${inv.invoiceNumber||'—'}</td>
            <td>${inv.customerName||'—'}</td>
            <td>${inv.createdAt?new Date(inv.createdAt).toLocaleDateString('en-IN'):'—'}</td>
            <td style="text-align:right;">₹${Number(inv.grandTotal||0).toFixed(2)}</td>
            <td style="text-align:center;text-transform:capitalize;">${inv.status||'—'}</td>
          </tr>`).join('')
        : `<tr><td colspan="6" style="text-align:center;color:#94a3b8;">No invoices found</td></tr>`;

      const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:32px;}
        h1{color:#2563eb;font-size:22px;margin-bottom:4px;}
        .sub{color:#64748b;font-size:13px;margin-bottom:24px;}
        .info{background:#f0f4fa;border-radius:8px;padding:14px 18px;margin-bottom:24px;display:flex;gap:24px;}
        .info-item{font-size:12px;color:#475569;} .info-item strong{color:#1a1a2e;display:block;font-size:14px;}
        table{width:100%;border-collapse:collapse;margin-top:8px;}
        thead tr{background:#2563eb;color:#fff;}
        thead th{padding:9px 10px;text-align:left;font-size:12px;}
        tbody tr:nth-child(even){background:#f0f4fa;}
        tbody td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;}
        .total-row{font-weight:700;background:#e0e7ff!important;}
        footer{margin-top:36px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;}
      </style></head><body>
      <h1>Dealer Statement</h1>
      <div class="sub">Generated by ${shopName} · ${date}</div>
      <div style="display:flex;gap:32px;margin-bottom:24px;background:#f0f4fa;padding:14px 18px;border-radius:8px;">
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Dealer</div><strong style="font-size:15px;">${dealer.name}</strong></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Phone</div><strong>${dealer.phone||'—'}</strong></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">GST</div><strong>${dealer.gst||'—'}</strong></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Total Ordered</div><strong style="color:#2563eb">₹${Number(dealer.totalOrdered||0).toFixed(2)}</strong></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Paid</div><strong style="color:#16a34a">₹${Number(dealer.totalPaid||0).toFixed(2)}</strong></div>
        <div><div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Payable</div><strong style="color:#dc2626">₹${Number(dealer.pending||0).toFixed(2)}</strong></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Invoice No.</th><th>Customer</th><th>Date</th><th style="text-align:right;">Amount</th><th style="text-align:center;">Status</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <footer>RetailPro · ${new Date().toLocaleString('en-IN')}</footer>
      </body></html>`;

      const {uri}=await Print.printToFileAsync({html,base64:false});
      const canShare=await Sharing.isAvailableAsync();
      if(canShare){
        await Sharing.shareAsync(uri,{mimeType:'application/pdf',dialogTitle:`${dealer.name} — Statement`});
      } else {
        Alert.alert('Saved',`PDF saved: ${uri}`);
      }
    }catch(err){
      Alert.alert('Error','Could not generate PDF. '+err.message);
    }finally{setPdfLoading(null);}
  };

  const renderItem=({item:d})=>(
    <View style={[styles.row,{backgroundColor:T.bgCard}]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.name,{color:T.textPrimary}]}>{d.name}</Text>
        <Text style={[styles.sub,{color:T.textMuted}]}>{d.phone||'—'} · GST: {d.gst||'—'}</Text>
        <Text style={[styles.sub,{color:T.textMuted}]}>{d.category}</Text>
        <View style={styles.amtRow}>
          <Text style={[styles.amtLabel,{color:T.textMuted}]}>Ordered: <Text style={[styles.amtVal,{color:T.textPrimary}]}>{formatCurrency(d.totalOrdered||0)}</Text></Text>
          <Text style={[styles.amtLabel,{color:T.textMuted}]}>Paid: <Text style={[styles.amtVal,{color:T.green}]}>{formatCurrency(d.totalPaid||0)}</Text></Text>
          {(d.pending||0)>0&&<Text style={[styles.amtLabel,{color:T.textMuted}]}>Payable: <Text style={[styles.amtVal,{color:T.red}]}>{formatCurrency(d.pending||0)}</Text></Text>}
        </View>
        {d.updatedAt&&<Text style={[styles.date,{color:T.textMuted}]}>Last: {formatDate(d.updatedAt)}</Text>}
      </View>
      <View style={styles.rowRight}>
        <Badge status={d.status||'new'}/>
        <View style={{flexDirection:'row',gap:6,marginVertical:4}}>
          <TouchableOpacity style={[styles.iconBtn,{backgroundColor:T.accentBg,borderColor:T.accent+'44'}]} onPress={()=>openEdit(d)}>
            <Feather name="edit-2" size={14} color={T.accent}/>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn,{backgroundColor:T.redBg,borderColor:T.red+'44'}]} onPress={()=>handleDelete(d._id)}>
            <Feather name="trash-2" size={14} color={T.red}/>
          </TouchableOpacity>
        </View>
        {/* PDF Download Button */}
        <TouchableOpacity style={[styles.pdfBtn,{backgroundColor:T.purpleBg,borderColor:T.purple+'44'}]}
          onPress={()=>handleDealerPdf(d)} disabled={pdfLoading===d._id}>
          {pdfLoading===d._id
            ?<ActivityIndicator size="small" color={T.purple}/>
            :<><Feather name="download" size={12} color={T.purple}/><Text style={[styles.pdfBtnText,{color:T.purple}]}> PDF</Text></>
          }
        </TouchableOpacity>
        {(d.pending||0)>0&&(
          <TouchableOpacity style={[styles.payBtn,{backgroundColor:T.redBg,borderColor:T.red+'44'}]} onPress={()=>{setSelected(d);setSettleAmt('');setSettleModal(true);}}>
            <Text style={[styles.payBtnText,{color:T.red}]}>💳 Pay</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return(
    <View style={[styles.container,{backgroundColor:T.bgBase}]}>
      <ScreenHeader
        title="Dealers & Suppliers"
        subtitle={`${dealers.length} dealers`}
        action={<TouchableOpacity style={[styles.addBtn,{backgroundColor:T.accent}]} onPress={openAdd}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>}
      />

      <View style={[styles.statsRow,{backgroundColor:T.bgSurface,borderBottomColor:T.border}]}>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.textPrimary}]}>{dealers.length}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>Total</Text>
        </View>
        <View style={[styles.statDivider,{backgroundColor:T.border}]}/>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.red}]}>{formatCurrency(totalPending)}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>Payable</Text>
        </View>
        <View style={[styles.statDivider,{backgroundColor:T.border}]}/>
        <View style={styles.statItem}>
          <Text style={[styles.statVal,{color:T.green}]}>{dealers.filter(d=>d.status==='paid').length}</Text>
          <Text style={[styles.statLbl,{color:T.textSecondary}]}>Settled</Text>
        </View>
      </View>

      <View style={{padding:SPACING.md,paddingBottom:0,gap:SPACING.sm}}>
        <TextInput 
          style={[styles.searchInput,{backgroundColor:T.bgCard,borderColor:T.border,color:T.textPrimary}]} 
          placeholder="Search dealers or GST…" 
          placeholderTextColor={T.textMuted} 
          value={search} 
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
          {['all','paid','pending','partial'].map(t=>(
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
          loading?<Text style={[styles.loadText,{color:T.textMuted}]}>Loading…</Text>
          :<EmptyState icon="🏭" title={dealers.length===0?'No dealers yet':'No dealers match your search'} subtitle={dealers.length===0?'Tap + Add to add your first dealer':''}/>
        }
        contentContainerStyle={filtered.length===0?{flex:1}:{paddingBottom:80}}
        ItemSeparatorComponent={()=><View style={{height:1,backgroundColor:T.border}}/>}
      />

      {/* Add/Edit Modal */}
      <Modal visible={addModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setAddModal(false)}>
        <View style={[styles.modalContainer,{backgroundColor:T.bgBase}]}>
          <View style={[styles.modalHeader,{borderBottomColor:T.border,backgroundColor:T.bgSurface}]}>
            <Text style={[styles.modalTitle,{color:T.textPrimary}]}>{editingId?'Edit Dealer':'Add Dealer'}</Text>
            <TouchableOpacity onPress={()=>setAddModal(false)}><Text style={[styles.modalClose,{color:T.textMuted}]}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <InputField label="Dealer / Company Name *" placeholder="e.g. National Electricals" value={form.name} onChangeText={v=>setForm({...form,name:v})}/>
            <InputField label="Phone" placeholder="Phone number" value={form.phone} onChangeText={v=>setForm({...form,phone:v})} keyboardType="phone-pad"/>
            <InputField label="GST Number" placeholder="15-character GST" value={form.gst} onChangeText={v=>setForm({...form,gst:v})} autoCapitalize="characters"/>
            {!!editingId&&(
              <View style={{flexDirection:'row',gap:SPACING.md}}>
                <View style={{flex:1}}><InputField label="Total Ordered Override" placeholder="Amount" value={form.totalOrdered} onChangeText={v=>setForm({...form,totalOrdered:v})} keyboardType="decimal-pad"/></View>
                <View style={{flex:1}}><InputField label="Total Paid Override" placeholder="Amount" value={form.totalPaid} onChangeText={v=>setForm({...form,totalPaid:v})} keyboardType="decimal-pad"/></View>
              </View>
            )}
            <Text style={[styles.fieldLabel,{color:T.textSecondary}]}>Category</Text>
            <View style={styles.chipRow}>
              {['Electrical','Hardware','Paint','Other'].map(c=>(
                <TouchableOpacity key={c} style={[styles.chip,{backgroundColor:T.bgElevated,borderColor:T.border},form.category===c&&{backgroundColor:T.accent,borderColor:T.accent}]} onPress={()=>setForm({...form,category:c})}>
                  <Text style={[styles.chipText,{color:T.textMuted},form.category===c&&{color:'#fff',fontWeight:'600'}]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PrimaryButton title={editingId?'Save Changes':'Add Dealer'} onPress={handleAdd} loading={saving} style={{marginTop:SPACING.sm}}/>
          </ScrollView>
        </View>
      </Modal>

      {/* Settle Modal */}
      <Modal visible={settleModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSettleModal(false)}>
        <View style={[styles.modalContainer,{backgroundColor:T.bgBase}]}>
          <View style={[styles.modalHeader,{borderBottomColor:T.border,backgroundColor:T.bgSurface}]}>
            <Text style={[styles.modalTitle,{color:T.textPrimary}]}>Pay Dealer</Text>
            <TouchableOpacity onPress={()=>setSettleModal(false)}><Text style={[styles.modalClose,{color:T.textMuted}]}>✕</Text></TouchableOpacity>
          </View>
          {selected&&(
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              <View style={[styles.settleInfo,{backgroundColor:T.bgElevated,borderColor:T.border}]}>
                <Text style={[styles.settleName,{color:T.textPrimary}]}>{selected.name}</Text>
                {[['Total Ordered',formatCurrency(selected.totalOrdered||0),T.textPrimary],['Already Paid',formatCurrency(selected.totalPaid||0),T.green],['Payable',formatCurrency(selected.pending||0),T.red]].map(([l,v,c])=>(
                  <View key={l} style={styles.settleRow}><Text style={[styles.settleLabel,{color:T.textMuted}]}>{l}</Text><Text style={[styles.settleValue,{color:c}]}>{v}</Text></View>
                ))}
              </View>
              <InputField label="Payment Amount (₹) *" placeholder="0.00" value={settleAmt} onChangeText={setSettleAmt} keyboardType="decimal-pad"/>
              <PrimaryButton title="Confirm Payment" onPress={handleSettle} loading={saving} color={T.red} style={{marginTop:SPACING.sm}}/>
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
  tabText:{fontSize:13,fontWeight:'600'},
  row:{padding:SPACING.md,flexDirection:'row',gap:SPACING.sm,marginHorizontal:SPACING.md,marginTop:SPACING.md,borderRadius:RADIUS.lg,borderWidth:1,borderColor:'transparent'},
  rowLeft:{flex:1,gap:4},
  rowRight:{alignItems:'flex-end',gap:SPACING.sm},
  name:{fontSize:16,fontWeight:'700'},
  sub:{fontSize:13},
  amtRow:{flexDirection:'row',flexWrap:'wrap',gap:SPACING.md,marginTop:6},
  amtLabel:{fontSize:12},
  amtVal:{fontWeight:'700'},
  date:{fontSize:11,marginTop:6},
  iconBtn:{borderRadius:RADIUS.md,padding:8,borderWidth:1},
  pdfBtn:{flexDirection:'row',alignItems:'center',borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:8,borderWidth:1},
  pdfBtnText:{fontSize:12,fontWeight:'700'},
  payBtn:{borderRadius:RADIUS.md,paddingHorizontal:12,paddingVertical:8,borderWidth:1},
  payBtnText:{fontSize:12,fontWeight:'700'},
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
  settleInfo:{borderRadius:RADIUS.lg,padding:SPACING.md,marginBottom:SPACING.lg,borderWidth:1,gap:SPACING.sm},
  settleName:{fontSize:18,fontWeight:'700',marginBottom:4},
  settleRow:{flexDirection:'row',justifyContent:'space-between'},
  settleLabel:{fontSize:14},
  settleValue:{fontSize:14,fontWeight:'700'},
});
