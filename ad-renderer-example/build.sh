environment=$1
if [ -z "$1" ]
    then
    environment="prod"
fi
npm run build --
echo ""
read -p "Press enter to continue"